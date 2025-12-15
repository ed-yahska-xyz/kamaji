const std = @import("std");
const build_options = @import("build_options");
extern var memory: f32;

const Imports = struct {
    extern fn jsRandom() f32;
};

pub fn Vec2(T: type) type {
    return struct {
        x: T,
        y: T,

        const Self = @This();

        pub fn init(x: T, y: T) Self {
            return Self{ .x = x, .y = y };
        }

        pub fn add(self: Self, other: Self) Self {
            return Self{ .x = self.x + other.x, .y = self.y + other.y };
        }

        pub fn sub(self: Self, other: Self) Self {
            return Self{ .x = self.x - other.x, .y = self.y - other.y };
        }

        pub fn scale(self: Self, s: T) Self {
            return Self{ .x = self.x * s, .y = self.y * s };
        }

        pub fn length(self: Self) T {
            return @sqrt(self.x * self.x + self.y * self.y);
        }

        pub fn normalize(self: Self) Self {
            const len = self.length();
            if (len == 0) return Self{ .x = 0, .y = 0 };
            return Self{ .x = self.x / len, .y = self.y / len };
        }

        pub fn limit(self: Self, max: T) Self {
            const len = self.length();
            if (len > max) {
                return self.normalize().scale(max);
            }
            return self;
        }
    };
}

const Vec2f = Vec2(f32);

// Boids algorithm parameters
const PERCEPTION_RADIUS: f32 = 50.0;
const SEPARATION_RADIUS: f32 = 25.0;
const MAX_SPEED: f32 = 4.0;
const MAX_FORCE: f32 = 0.1;
const SEPARATION_WEIGHT: f32 = 1.5;
const ALIGNMENT_WEIGHT: f32 = 1.0;
const COHESION_WEIGHT: f32 = 1.0;

// var prng = std.rand.DefaultPrng.init(7777);
// const rand = prng.random();

const Boid = struct {
    location: Vec2f,
    motion: Vec2f,

    pub fn init(location: Vec2f, motion: Vec2f) Boid {
        return Boid{
            .location = location,
            .motion = motion,
        };
    }
};

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

export fn add(a: i32, b: i32) i32 {
    return a + b;
}

// Boid data layout: [x, y, vx, vy] per boid (4 floats each)
// length = number of boids
export fn moveBoid(b: [*]f32, length: usize, width: f32, height: f32) void {
    const stride = 4; // x, y, vx, vy

    // Process each boid
    for (0..length) |i| {
        const idx = i * stride;
        const pos = Vec2f.init(b[idx], b[idx + 1]);
        var vel = Vec2f.init(b[idx + 2], b[idx + 3]);

        // Initialize steering forces
        var separation = Vec2f.init(0, 0);
        var alignment = Vec2f.init(0, 0);
        var cohesion = Vec2f.init(0, 0);
        var sep_count: f32 = 0;
        var align_count: f32 = 0;
        var cohesion_count: f32 = 0;

        // Check all other boids
        for (0..length) |j| {
            if (i == j) continue;

            const other_idx = j * stride;
            const other_pos = Vec2f.init(b[other_idx], b[other_idx + 1]);
            const other_vel = Vec2f.init(b[other_idx + 2], b[other_idx + 3]);

            const diff = pos.sub(other_pos);
            const dist = diff.length();

            // Separation: steer away from nearby boids
            if (dist > 0 and dist < SEPARATION_RADIUS) {
                const repel = diff.normalize().scale(1.0 / dist);
                separation = separation.add(repel);
                sep_count += 1;
            }

            // Alignment & Cohesion: consider boids within perception radius
            if (dist > 0 and dist < PERCEPTION_RADIUS) {
                alignment = alignment.add(other_vel);
                align_count += 1;

                cohesion = cohesion.add(other_pos);
                cohesion_count += 1;
            }
        }

        var accel = Vec2f.init(0, 0);

        // Apply separation
        if (sep_count > 0) {
            separation = separation.scale(1.0 / sep_count);
            separation = separation.normalize().scale(MAX_SPEED);
            separation = separation.sub(vel).limit(MAX_FORCE);
            accel = accel.add(separation.scale(SEPARATION_WEIGHT));
        }

        // Apply alignment
        if (align_count > 0) {
            alignment = alignment.scale(1.0 / align_count);
            alignment = alignment.normalize().scale(MAX_SPEED);
            alignment = alignment.sub(vel).limit(MAX_FORCE);
            accel = accel.add(alignment.scale(ALIGNMENT_WEIGHT));
        }

        // Apply cohesion
        if (cohesion_count > 0) {
            cohesion = cohesion.scale(1.0 / cohesion_count);
            const desired = cohesion.sub(pos).normalize().scale(MAX_SPEED);
            const steer = desired.sub(vel).limit(MAX_FORCE);
            accel = accel.add(steer.scale(COHESION_WEIGHT));
        }

        // Update velocity
        vel = vel.add(accel).limit(MAX_SPEED);

        // Update position
        var new_pos = pos.add(vel);

        // Wrap around edges
        if (new_pos.x < 0) new_pos.x += width;
        if (new_pos.x > width) new_pos.x -= width;
        if (new_pos.y < 0) new_pos.y += height;
        if (new_pos.y > height) new_pos.y -= height;

        // Write back
        b[idx] = new_pos.x;
        b[idx + 1] = new_pos.y;
        b[idx + 2] = vel.x;
        b[idx + 3] = vel.y;
    }
}

export fn createBoids(count: usize) ?[*]Boid {
    const arr = allocator.alloc(Boid, count) catch return null;
    for (0..arr.len) |i| {
        const x = Imports.jsRandom();
        const y = Imports.jsRandom();
        const mx = Imports.jsRandom();
        const my = Imports.jsRandom();
        arr[i] = Boid.init(Vec2(f32).init(x, y), Vec2(f32).init(mx, my));
    }
    const ptr: [*]Boid = arr.ptr;
    return ptr;
}

export fn alloc(len: usize) ?[*]f32 {
    const arr = allocator.alloc(f32, len) catch return null;
    @memset(arr, 0.0);
    const ptr: [*]f32 = arr.ptr;
    return ptr;
}

test "pointer arithmatic" {
    const x = alloc(5);
    moveBoid(x.?, 5);
    for (0..5) |i| {
        const p = x.? + i * @sizeOf(f32);
        std.debug.print("{d} ", .{p[0]});
    }
}
