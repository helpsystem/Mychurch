export const CHRISTIAN_IMAGES = [
  '/images/Church_interior_worship_space_70ed9ac2.png', // beautiful church interior with warm lighting
  '/images/Church_community_gathering_a97f90e1.png', // diverse Persian Christian community gathering
  '/images/Prayer_circle_hands_together_feb88f83.png', // hands joined together in prayer circle
  '/images/Bible_study_peaceful_setting_6bb44b27.png', // open Bible with peaceful study setting
  '/images/Modern_church_building_exterior_83da6dba.png', // modern church building exterior
  '/images/Persian_Christian_choir_singing_bfe3adf8.png', // Persian Christian choir singing together
  '/images/Children_Sunday_school_class_ade575b6.png', // children's Sunday school class
  '/images/cross-cave-sunset.jpg', // cross in cave with sunset background
  '/images/jesus-cross-sunset.jpg' // Jesus cross with beautiful sunset
];

export const getRandomImage = () => {
  return CHRISTIAN_IMAGES[Math.floor(Math.random() * CHRISTIAN_IMAGES.length)];
};