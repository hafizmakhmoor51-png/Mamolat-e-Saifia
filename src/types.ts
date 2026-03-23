export interface ShajraMember {
  name: string;
  bio: string;
}

export interface Shajra {
  title: string;
  members: ShajraMember[];
}

export interface Muraqaba {
  title: string;
  text: string;
}

export interface Khatm {
  name: string;
  zikr: string;
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}
