export interface PuneArea {
  slug: string;
  name: string;
  description: string;
  avgRent: string;
  nearbyParks: string[];
  metaTitle: string;
  metaDescription: string;
  faqs: { question: string; answer: string }[];
}

export const PUNE_AREAS: PuneArea[] = [
  {
    slug: 'hinjewadi',
    name: 'Hinjewadi',
    description: 'Hinjewadi is Pune\'s largest IT hub, home to Rajiv Gandhi Infotech Park with offices of TCS, Infosys, Wipro, and Cognizant. It offers a mix of affordable PGs, modern apartments, and gated communities perfect for young professionals.',
    avgRent: '₹8,000 – ₹25,000/month',
    nearbyParks: ['Rajiv Gandhi Infotech Park Phase 1, 2, 3', 'Blue Ridge SEZ', 'Wipro Campus'],
    metaTitle: 'Apartments for Rent in Hinjewadi, Pune | RentMeAbhi',
    metaDescription: 'Find affordable rentals in Hinjewadi near IT parks. Browse verified apartments, PGs, and flats near Rajiv Gandhi Infotech Park. Book instantly on RentMeAbhi.',
    faqs: [
      { question: 'What is the average rent in Hinjewadi, Pune?', answer: 'Average rent for a 1BHK in Hinjewadi ranges from ₹8,000 to ₹15,000 per month. 2BHK apartments typically cost ₹15,000 to ₹25,000 per month depending on the society and phase.' },
      { question: 'Is Hinjewadi good for IT professionals?', answer: 'Yes, Hinjewadi is one of the best areas for IT professionals in Pune. It houses Rajiv Gandhi Infotech Park with offices of major IT companies like TCS, Infosys, Wipro, and Cognizant.' },
      { question: 'How far is Hinjewadi from Pune city center?', answer: 'Hinjewadi is approximately 22 km from Pune city center (Shivajinagar). The drive takes 45–60 minutes depending on traffic.' },
    ],
  },
  {
    slug: 'kharadi',
    name: 'Kharadi',
    description: 'Kharadi is a rapidly growing IT corridor on the eastern side of Pune, known for EON IT Park and World Trade Center. The area offers excellent connectivity to the airport and a vibrant social scene.',
    avgRent: '₹10,000 – ₹30,000/month',
    nearbyParks: ['EON IT Park', 'World Trade Center', 'Zensar Technologies Campus'],
    metaTitle: 'Apartments for Rent in Kharadi, Pune | RentMeAbhi',
    metaDescription: 'Rent apartments and flats in Kharadi, Pune near EON IT Park. Verified listings with photos. Book your next home on RentMeAbhi.',
    faqs: [
      { question: 'What is the average rent in Kharadi?', answer: 'A 1BHK in Kharadi costs ₹10,000–₹18,000/month. 2BHK flats range from ₹18,000 to ₹30,000 depending on the complex.' },
      { question: 'Is Kharadi close to the airport?', answer: 'Yes, Kharadi is just 7 km from Pune International Airport, making it one of the most convenient locations for frequent travellers.' },
    ],
  },
  {
    slug: 'viman-nagar',
    name: 'Viman Nagar',
    description: 'Viman Nagar is one of Pune\'s most premium residential and commercial areas, located near the airport. It offers upscale living with excellent restaurants, malls, and connectivity.',
    avgRent: '₹12,000 – ₹35,000/month',
    nearbyParks: ['Commerzone IT Park', 'Naylor Road Tech Hub', 'Cerebrum IT Park (nearby)'],
    metaTitle: 'Apartments for Rent in Viman Nagar, Pune | RentMeAbhi',
    metaDescription: 'Find premium rentals in Viman Nagar, Pune. Browse verified apartments near the airport and IT parks. Instant booking on RentMeAbhi.',
    faqs: [
      { question: 'Why is Viman Nagar popular for rentals?', answer: 'Viman Nagar offers proximity to the airport, premium restaurants, Phoenix Marketcity mall, and excellent road connectivity. It\'s popular among IT professionals and expats.' },
      { question: 'What is the average rent in Viman Nagar?', answer: '1BHK apartments cost ₹12,000–₹20,000/month. Premium 2BHK flats range from ₹20,000 to ₹35,000 per month.' },
    ],
  },
  {
    slug: 'wakad',
    name: 'Wakad',
    description: 'Wakad is a well-connected suburb near Hinjewadi, offering affordable housing options for IT professionals. It has grown rapidly with new residential projects, restaurants, and shopping areas.',
    avgRent: '₹7,000 – ₹22,000/month',
    nearbyParks: ['Hinjewadi IT Park (5 min)', 'Blue Ridge Township'],
    metaTitle: 'Apartments for Rent in Wakad, Pune | RentMeAbhi',
    metaDescription: 'Affordable rentals in Wakad, Pune near Hinjewadi IT Park. Browse verified apartments and flats. Book on RentMeAbhi.',
    faqs: [
      { question: 'Is Wakad cheaper than Hinjewadi?', answer: 'Yes, Wakad generally offers 10-20% lower rents compared to Hinjewadi while being just 5-10 minutes away from the IT park.' },
      { question: 'What is the average rent in Wakad?', answer: '1BHK apartments in Wakad cost ₹7,000–₹14,000/month. 2BHK flats are available for ₹14,000–₹22,000 per month.' },
    ],
  },
  {
    slug: 'baner',
    name: 'Baner',
    description: 'Baner is a premium residential area in Pune known for its hillside living, upscale restaurants, and proximity to both Hinjewadi and the city center. It\'s a favourite among young professionals and families.',
    avgRent: '₹12,000 – ₹35,000/month',
    nearbyParks: ['Hinjewadi IT Park (10 min)', 'Baner Tech Park'],
    metaTitle: 'Apartments for Rent in Baner, Pune | RentMeAbhi',
    metaDescription: 'Premium rentals in Baner, Pune. Hillside apartments near Hinjewadi IT Park. Verified listings on RentMeAbhi.',
    faqs: [
      { question: 'Why is Baner popular for renting in Pune?', answer: 'Baner offers a perfect balance of city life and IT hub proximity. It has excellent restaurants, cafes, shopping, and is just 10 minutes from Hinjewadi IT Park.' },
      { question: 'What is the average rent in Baner?', answer: '1BHK apartments in Baner cost ₹12,000–₹20,000/month. Premium 2BHK flats range from ₹20,000 to ₹35,000 per month.' },
    ],
  },
  {
    slug: 'magarpatta',
    name: 'Magarpatta',
    description: 'Magarpatta City is a self-sustained township in Pune with its own IT park, schools, hospitals, and commercial spaces. It offers a secure, gated community living experience.',
    avgRent: '₹12,000 – ₹30,000/month',
    nearbyParks: ['Magarpatta Cybercity', 'Amanora IT Park (nearby)'],
    metaTitle: 'Apartments for Rent in Magarpatta, Pune | RentMeAbhi',
    metaDescription: 'Rent in Magarpatta City, Pune. Self-sustained township with IT park. Verified apartments on RentMeAbhi.',
    faqs: [
      { question: 'What makes Magarpatta City unique?', answer: 'Magarpatta City is a fully self-sustained township with its own IT park, schools, hospitals, malls, and 24/7 security. Residents can walk to work and all amenities.' },
      { question: 'What is the average rent in Magarpatta?', answer: '1BHK apartments cost ₹12,000–₹18,000/month inside the township. 2BHK flats range from ₹18,000 to ₹30,000 per month.' },
    ],
  },
];
