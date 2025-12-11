export interface Stat {
  value: string;
  label: string;
}

export interface Interest {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface Profile {
  name: string;
  initials: string;
  tagline: string;
  birthdate: string;
  education: {
    degree: string;
    university: string;
  };
  stats: Stat[];
  interests: Interest[];
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
  footer: {
    copyright: string;
    tagline: string;
  };
}
