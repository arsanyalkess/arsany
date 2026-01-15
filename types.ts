
export type TargetPlatform = 'Midjourney' | 'Stable Diffusion' | 'DALL-E' | 'Other';

export interface ImageData {
  file: File | null;
  previewUrl: string | null;
  analysisText: string | null;
  isAnalyzing: boolean;
  role: string;
  isActive: boolean;
}

export interface ProjectState {
  projectName: string;
  targetPlatform: TargetPlatform;
  
  environment: {
    sceneType: string;
    mood: string;
    image: ImageData;
  };
  
  model: {
    gender: string;
    ageRange: string;
    bodyType: string;
    skinTone: string;
    facialStyle: string;
    hairStyle: string;
    image: ImageData;
  };
  
  outfit: {
    garmentType: string;
    cut: string;
    fabric: string;
    texture: string;
    colorPalette: string;
    details: string;
    image: ImageData;
  };
  
  pose: {
    bodyPose: string;
    fabricMovement: string;
    facialExpression: string;
    fashionMood: string;
    image: ImageData;
  };
  
  lighting: {
    lightingType: string;
    shadowIntensity: string;
    lens: string;
    shotType: string;
    image: ImageData;
  };
  
  quality: {
    realismLevel: string;
    style: string;
    imageQuality: string;
  };
}

export const INITIAL_IMAGE_DATA: ImageData = {
  file: null,
  previewUrl: null,
  analysisText: null,
  isAnalyzing: false,
  role: '',
  isActive: true,
};

export const INITIAL_STATE: ProjectState = {
  projectName: '',
  targetPlatform: 'Midjourney',
  environment: { sceneType: 'Studio', mood: 'Clean', image: { ...INITIAL_IMAGE_DATA, role: 'Background & Lighting Inspiration' } },
  model: { gender: 'Female', ageRange: '20-30', bodyType: 'Slim', skinTone: 'Natural', facialStyle: 'Editorial', hairStyle: 'Sleek Back', image: { ...INITIAL_IMAGE_DATA, role: 'Face & Body Proportions' } },
  outfit: { garmentType: 'Avant-garde Gown', cut: 'Fitted', fabric: 'Silk Satin', texture: 'Glossy', colorPalette: 'Monochrome Black', details: 'Intricate Drapery', image: { ...INITIAL_IMAGE_DATA, role: 'Design & Silhouette Reference' } },
  pose: { bodyPose: 'Standing', fabricMovement: 'Static', facialExpression: 'Confident', fashionMood: 'Editorial', image: { ...INITIAL_IMAGE_DATA, role: 'Pose Reference' } },
  lighting: { lightingType: 'Soft Studio', shadowIntensity: 'Subtle', lens: '85mm', shotType: 'Full Body', image: { ...INITIAL_IMAGE_DATA, role: 'Lighting Reference' } },
  quality: { realismLevel: 'Photorealistic', style: 'Editorial', imageQuality: '8K UHD' },
};
