// Every commented properties are missing fields from the database
export interface EventInterface {
  id: string;
  name: string;
  creatorId: {
    id: string;
    name: string;
  };
  date: Date;
  description: string;
  logo?: string;
  logoPublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  tags: Array<string | {id: string; name: string; createdAt?: string}>;
  location: string;
  meteo?:
    | {
        condition?: string;
        temperature?: number | string;
        trackCondition?: 'dry' | 'wet' | 'mixed' | 'damp' | 'slippery' | 'drying';
        circuitName?: string;
        expectedParticipants?: number;
        eventResultsLink?: string;
        seasonResultsLink?: string;
        [key: string]: any;
      }
    | string;
  urlTIcket: string;
  website?: string;
  finished: boolean;
  createdAt: string;
  participationTagText?: string;
  participationTagColor?: string;
  relatedProducts: {
    id: string;
    tag: string;
    image: string;
    name: string;
    price: string;
  }[];
  reviews: {
    eventId: number;
    userId: number;
    note: number;
    description: string;
    avatar: string;
    username: string;
  }[];
}
