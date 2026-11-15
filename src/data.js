// Everything you will most often edit lives here. Coordinates are [longitude, latitude].
// Positions other than Media Design School are approximate: check/adjust them.
export const CONFIG={
  STYLE:'https://tiles.openfreemap.org/styles/liberty',               // free vector map style, no API key
  ROUTER:'https://routing.openstreetmap.de/routed-bike/route/v1/driving', // bike profile = prefers cycle lanes (demo server)
  SPEED:60,                                                            // demo scooter speed in metres per second
  BOUNDS:[[174.735,-36.875],[174.795,-36.825]]                         // limits panning to the CBD area
};
export const START=[174.75688,-36.84249]; // Media Design School, 10 Madden St
// type: 'location' | 'activity' | 'nest'. tags drive the filter chips.
export const ITEMS=[
 {id:'mds',type:'nest',name:'Media Design School',ll:START,hook:'Your starting nest',tags:['nest'],desc:'A nest at the Media Design School campus on Madden Street in the Wynyard Quarter. Every journey starts here.'},
 {id:'wynyard',type:'location',name:'Wynyard Crossing',ll:[174.7583,-36.8427],hook:'Bridge over the harbour edge',tags:['views'],desc:'A walking and cycling crossing linking Viaduct Harbour and the Wynyard Quarter, with open water views on both sides.'},
 {id:'sky',type:'location',name:'Sky Tower',ll:[174.7621,-36.8485],hook:'The city from 328 metres up',tags:['views'],desc:'Auckland\u2019s tallest structure and one of the best viewpoints over the city and harbour.'},
 {id:'viaduct',type:'location',name:'Viaduct Harbour',ll:[174.7598,-36.8433],hook:'Boats, cafes and water views',tags:['views'],desc:'A waterfront marina area with plenty of places to stop and watch the boats.'},
 {id:'albert',type:'location',name:'Albert Park',ll:[174.7693,-36.8517],hook:'A green pause above the CBD',tags:[],desc:'A leafy park on the hill above the CBD, handy for a break between streets.'},
 {id:'gallery',type:'location',name:'Auckland Art Gallery',ll:[174.7665,-36.8510],hook:'Art beside the park',tags:[],desc:'The city\u2019s main art gallery, facing Albert Park.'},
 {id:'n-britomart',type:'nest',name:'Britomart Nest',ll:[174.7693,-36.8439],hook:'Scooter and bike rack',tags:['nest'],desc:'A nest near Britomart Station. Placeholder text.'},
 {id:'n-ferry',type:'nest',name:'Ferry Building Nest',ll:[174.7683,-36.8433],hook:'Scooter and bike rack',tags:['nest','views'],desc:'A nest by the ferry terminals. Placeholder text.'},
 {id:'n-aotea',type:'nest',name:'Aotea Square Nest',ll:[174.7633,-36.8497],hook:'Scooter and bike rack',tags:['nest'],desc:'A nest at Aotea Square. Placeholder text.'},
 {id:'n-silo',type:'nest',name:'Silo Park Nest',ll:[174.7583,-36.8414],hook:'Scooter and bike rack',tags:['nest','views'],desc:'A nest at Silo Park. Placeholder text.'},
 {id:'n-victoria',type:'nest',name:'Victoria Park Nest',ll:[174.7548,-36.8486],hook:'Scooter and bike rack',tags:['nest'],desc:'A nest by Victoria Park. Placeholder text.'},
 {id:'n-albert',type:'nest',name:'Albert Park Nest',ll:[174.7683,-36.8512],hook:'Scooter and bike rack',tags:['nest'],desc:'A nest by Albert Park. Placeholder text.'},
 {id:'n-sky',type:'nest',name:'Sky Tower Nest',ll:[174.7616,-36.8490],hook:'Scooter and bike rack',tags:['nest'],desc:'A nest below the Sky Tower. Placeholder text.'},
 {id:'n-kroad',type:'nest',name:'K Road Nest',ll:[174.7578,-36.8583],hook:'Scooter and bike rack',tags:['nest'],desc:'A nest on Karangahape Road. Placeholder text.'},
 {id:'canvas',type:'activity',name:'Living Canvas',ll:[174.7691,-36.8447],hook:'Art that moves with you',tags:['outdoors'],desc:'An interactive artwork in the pedestrian area beside Britomart. Placeholder description.'},
 {id:'gacha',type:'activity',name:'Gacha Machines',ll:[174.7641,-36.8490],hook:'Win a surprise capsule toy',tags:[],desc:'Rows of capsule toy machines. Placeholder description and position.'},
 {id:'cutouts',type:'activity',name:'Head in a Hole Cutouts',ll:[174.7603,-36.8431],hook:'Poke your head through and pose',tags:['outdoors'],desc:'Painted boards with face holes for silly photos. Placeholder description and position.'},
 {id:"arcade",type:'activity',name:"Neon Alley Arcade",ll:[174.7667,-36.8445],hook:"Retro games under neon lights",tags:[],desc:"Retro games under neon lights. Fictional placeholder activity: replace with a real one."},
 {id:"nightlane",type:'activity',name:"Night Market Lane",ll:[174.758,-36.8418],hook:"Street food after dark",tags:["outdoors"],desc:"Street food after dark. Fictional placeholder activity: replace with a real one."},
 {id:"mural",type:'activity',name:"Mural Walk",ll:[174.758,-36.8575],hook:"A walking trail of street art",tags:["outdoors", "free"],desc:"A walking trail of street art. Fictional placeholder activity: replace with a real one."},
 {id:"rooftop",type:'activity',name:"Rooftop Cinema Club",ll:[174.765,-36.8492],hook:"Movies under the stars",tags:[],desc:"Movies under the stars. Fictional placeholder activity: replace with a real one."},
 {id:"piano",type:'activity',name:"Street Piano Corner",ll:[174.7635,-36.8503],hook:"Sit down and play a tune",tags:["outdoors", "free"],desc:"Sit down and play a tune. Fictional placeholder activity: replace with a real one."},
 {id:"photobooth",type:'activity',name:"Retro Photo Booth",ll:[174.767,-36.848],hook:"Four frames, zero filters",tags:[],desc:"Four frames, zero filters. Fictional placeholder activity: replace with a real one."},
 {id:"kite",type:'activity',name:"Harbour Kite Lawn",ll:[174.7566,-36.8403],hook:"Open lawn and sea breeze",tags:["outdoors", "free"],desc:"Open lawn and sea breeze. Fictional placeholder activity: replace with a real one."},
 {id:"chess",type:'activity',name:"Giant Chess Square",ll:[174.7637,-36.8499],hook:"Move the knee-high pieces",tags:["outdoors", "free"],desc:"Move the knee-high pieces. Fictional placeholder activity: replace with a real one."},
 {id:"bubble",type:'activity',name:"Bubble Garden",ll:[174.7552,-36.8492],hook:"Walk through giant bubbles",tags:["outdoors", "free"],desc:"Walk through giant bubbles. Fictional placeholder activity: replace with a real one."},
 {id:"selfie",type:'activity',name:"Ferry Selfie Wall",ll:[174.7686,-36.8437],hook:"Pose with the harbour",tags:["outdoors", "free"],desc:"Pose with the harbour. Fictional placeholder activity: replace with a real one."},
 {id:"maze",type:'activity',name:"Hedge Maze",ll:[174.7688,-36.8523],hook:"Get lost in the park",tags:["outdoors", "free"],desc:"Get lost in the park. Fictional placeholder activity: replace with a real one."},
 {id:"skate",type:'activity',name:"Skate Ramp Spot",ll:[174.7562,-36.8425],hook:"Watch or try a trick",tags:["outdoors", "free"],desc:"Watch or try a trick. Fictional placeholder activity: replace with a real one."},
 {id:"busker",type:'activity',name:"Busker Stage",ll:[174.7672,-36.8471],hook:"Live music on Queen Street",tags:["outdoors", "free"],desc:"Live music on Queen Street. Fictional placeholder activity: replace with a real one."},
 {id:"sunset",type:'activity',name:"Sunset Deck",ll:[174.7576,-36.8438],hook:"Best seats for golden hour",tags:["outdoors", "free"],desc:"Best seats for golden hour. Fictional placeholder activity: replace with a real one."},
 {id:"lights",type:'activity',name:"Light Tunnel",ll:[174.7699,-36.8456],hook:"Walk through glowing arches",tags:["outdoors", "free"],desc:"Walk through glowing arches. Fictional placeholder activity: replace with a real one."},
 {id:"puppets",type:'activity',name:"Puppet Theatre Pop-up",ll:[174.7658,-36.8512],hook:"Tiny shows, big laughs",tags:[],desc:"Tiny shows, big laughs. Fictional placeholder activity: replace with a real one."}
];
// Popularity score (higher = earlier in the 'Most popular' carousels). Only items listed here appear there.
export const POP={sky:10,viaduct:9,wynyard:9,mds:8,albert:7,gallery:6,'n-ferry':5,canvas:10,gacha:9,cutouts:8,arcade:8,nightlane:8,mural:7,rooftop:7,piano:6,sunset:6};

// Hidden gems. 'at' = collected when the scooter arrives at that item id; 'll' = collected if a trip passes within GEM_RADIUS metres.
// Only some places have gems. Route gems are only found if the (random) route happens to pass them. Edit freely.
export const GEM_RADIUS=70;
export const GEMS=[
 {id:'g-canvas',name:'Living Canvas Gem',text:'A shimmering tile was hidden in the artwork.',at:'canvas'},
 {id:'g-gacha',name:'Golden Capsule',text:'A gold capsule rolled out of the machine.',at:'gacha'},
 {id:'g-wynyard',name:'Harbour Pearl',text:'Something sparkled between the bridge planks.',at:'wynyard'},
 {id:'g-sky',name:'Skyline Shard',text:'A glass-like shard was tucked at the foot of the tower.',at:'sky'},
 {id:'g-maze',name:'Maze Emerald',text:'You found the green stone in the middle of the maze.',at:'maze'},
 {id:'g-silo',name:'Silo Spark',text:'A spark of light was hiding by the nest.',at:'n-silo'},
 {id:'g-mural',name:'Mural Fragment',text:'A tiny painted tile was set into the wall.',at:'mural'},
 {id:'r-queen',name:'Queen Street Glimmer',text:'A glint on the footpath caught your eye as you rode past.',ll:[174.7650,-36.8480]},
 {id:'r-quay',name:'Quay Street Coin',text:'An odd old coin was lying by the kerb.',ll:[174.7627,-36.8431]},
 {id:'r-viaduct',name:'Viaduct Whisper',text:'You heard a faint chime near the water.',ll:[174.7600,-36.8441]},
 {id:'r-wynyard',name:'Wynyard Ember',text:'A warm glow flickered beside the path.',ll:[174.7590,-36.8418]},
 {id:'r-albert',name:'Park Acorn',text:'A golden acorn sat on a bench.',ll:[174.7690,-36.8505]}
];
