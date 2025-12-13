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

export interface Education {
  degree: string;
  university: string;
}

export interface Profile {
  name: string;
  initials: string;
  tagline: string;
  birthdate: string;
  education: Education[];
  stats: Stat[];
  interests: Interest[];
  contact: {
    email: string;
  };
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
