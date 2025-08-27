export const CHRISTIAN_IMAGES = [
  'https://images.unsplash.com/photo-1508361001413-7a9dca2c302d?q=80&w=1970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // cross on hill
  'https://images.unsplash.com/photo-1595147389337-3331b67277b5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // stained glass
  'https://images.unsplash.com/photo-1512403759738-c13b39744520?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // person praying in church
  'https://images.unsplash.com/photo-1444858349978-a0e4a4a15e6a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // open bible with cross
  'https://images.unsplash.com/photo-1560439546-13de4a415347?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // church interior
  'https://images.unsplash.com/photo-1600033190885-b1a9c1c79a5e?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // hands praying
  'https://images.unsplash.com/photo-1537526949396-93c4a433f380?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // white church exterior
  'https://images.unsplash.com/photo-1507548293-12a4ce5f1e8e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'  // candles in church
];

export const getRandomImage = () => {
  return CHRISTIAN_IMAGES[Math.floor(Math.random() * CHRISTIAN_IMAGES.length)];
};
