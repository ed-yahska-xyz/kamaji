---
"kamaji": patch
---

Fix the production image build failing on the elo predictor assets. The build copied the predictor's data/flag assets with a recursive directory copy, which throws `EEXIST` under the Bun version used in the Docker build when the destination already exists. The copy now clears the destination first, so the container image (and the World Cup predictor it ships) builds and deploys.
