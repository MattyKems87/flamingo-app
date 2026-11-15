// Everything you will most often edit lives here. Coordinates are [longitude, latitude].
// Positions other than Media Design School are approximate: check/adjust them.
export const CONFIG = {
  STYLE: 'https://tiles.openfreemap.org/styles/liberty',               // free vector map style, no API key
  ROUTER: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving', // bike profile = prefers cycle lanes (demo server)
  SPEED: 70,                                                            // demo scooter speed in metres per second
  BOUNDS: [[174.735, -36.875], [174.795, -36.825]]                         // limits panning to the CBD area
};
export const START = [174.75688, -36.84249]; // Media Design School, 10 Madden St
// type: 'location' | 'activity' | 'nest'. tags drive the filter chips.
export const ITEMS = [
  { id: 'mds', type: 'nest', name: 'Media Design School', ll: START, hook: 'Your starting nest', tags: ['nest'], desc: 'A nest at the Media Design School campus on Madden Street in the Wynyard Quarter. Every journey starts here.' },
  { id: 'wynyard', type: 'location', name: 'Wynyard Crossing', ll: [174.7583, -36.8427], hook: 'Bridge over the harbour edge', tags: ['views'], desc: 'A walking and cycling crossing linking Viaduct Harbour and the Wynyard Quarter, with open water views on both sides.' },
  { id: 'sky', type: 'location', name: 'Sky Tower', ll: [174.7621, -36.8485], hook: 'The city from 328 metres up', tags: ['views'], desc: 'Auckland\u2019s tallest structure and one of the best viewpoints over the city and harbour.' },
  { id: 'viaduct', type: 'location', name: 'Viaduct Harbour', ll: [174.7598, -36.8433], hook: 'Boats, cafes and water views', tags: ['views'], desc: 'A waterfront marina area with plenty of places to stop and watch the boats.' },
  { id: 'albert', type: 'location', name: 'Albert Park', ll: [174.7693, -36.8517], hook: 'A green pause above the CBD', tags: [], desc: 'A leafy park on the hill above the CBD, handy for a break between streets.' },
  { id: 'gallery', type: 'location', name: 'Auckland Art Gallery', ll: [174.7665, -36.8510], hook: 'Art beside the park', tags: [], desc: 'The city\u2019s main art gallery, facing Albert Park.' },
  { id: 'n-britomart', type: 'nest', name: 'Britomart Nest', ll: [174.7693, -36.8439], hook: 'Scooter and bike rack', tags: ['nest'], desc: 'A nest near Britomart Station. Placeholder text.' },
  { id: 'n-ferry', type: 'nest', name: 'Ferry Building Nest', ll: [174.7683, -36.8433], hook: 'Scooter and bike rack', tags: ['nest', 'views'], desc: 'A nest by the ferry terminals. Placeholder text.' },
  { id: 'n-aotea', type: 'nest', name: 'Aotea Square Nest', ll: [174.7633, -36.8497], hook: 'Scooter and bike rack', tags: ['nest'], desc: 'A nest at Aotea Square. Placeholder text.' },
  { id: 'n-silo', type: 'nest', name: 'Silo Park Nest', ll: [174.7583, -36.8414], hook: 'Scooter and bike rack', tags: ['nest', 'views'], desc: 'A nest at Silo Park. Placeholder text.' },
  { id: 'n-victoria', type: 'nest', name: 'Victoria Park Nest', ll: [174.7548, -36.8486], hook: 'Scooter and bike rack', tags: ['nest'], desc: 'A nest by Victoria Park. Placeholder text.' },
  { id: 'n-albert', type: 'nest', name: 'Albert Park Nest', ll: [174.7683, -36.8512], hook: 'Scooter and bike rack', tags: ['nest'], desc: 'A nest by Albert Park. Placeholder text.' },
  { id: 'n-sky', type: 'nest', name: 'Sky Tower Nest', ll: [174.7616, -36.8490], hook: 'Scooter and bike rack', tags: ['nest'], desc: 'A nest below the Sky Tower. Placeholder text.' },
  { id: 'n-kroad', type: 'nest', name: 'K Road Nest', ll: [174.7578, -36.8583], hook: 'Scooter and bike rack', tags: ['nest'], desc: 'A nest on Karangahape Road. Placeholder text.' },
  { id: 'canvas', type: 'activity', name: 'Living Canvas', ll: [174.7691, -36.8447], hook: 'Art that moves with you', tags: ['outdoors'], desc: 'An interactive artwork in the pedestrian area beside Britomart. Placeholder description.' },
  { id: 'gacha', type: 'activity', name: 'Gacha Machines', ll: [174.7641, -36.8490], hook: 'Win a surprise capsule toy', tags: [], desc: 'Rows of capsule toy machines. Placeholder description and position.' },
  { id: 'cutouts', type: 'activity', name: 'Head in a Hole Cutouts', ll: [174.7603, -36.8431], hook: 'Poke your head through and pose', tags: ['outdoors'], desc: 'Painted boards with face holes for silly photos. Placeholder description and position.' }
];
