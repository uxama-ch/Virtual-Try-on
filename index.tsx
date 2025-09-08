/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from '@google/genai';

// --- Types ---
type Tool = 'shoes' | 'tshirts' | 'hoodies' | 'jackets' | 'pants' | 'suits' | 'traditional' | 'sportswear' | 'glasses' | 'hats' | 'watches' | 'bracelets' | 'bags';

// --- DOM Element References ---

// Main Navigation
const navShoesBtn = document.getElementById('nav-shoes') as HTMLButtonElement;
const navTshirtsBtn = document.getElementById('nav-tshirts') as HTMLButtonElement;
const navHoodiesBtn = document.getElementById('nav-hoodies') as HTMLButtonElement;
const navJacketsBtn = document.getElementById('nav-jackets') as HTMLButtonElement;
const navPantsBtn = document.getElementById('nav-pants') as HTMLButtonElement;
const navSuitsBtn = document.getElementById('nav-suits') as HTMLButtonElement;
const navTraditionalBtn = document.getElementById('nav-traditional') as HTMLButtonElement;
const navSportswearBtn = document.getElementById('nav-sportswear') as HTMLButtonElement;
const navAccessoriesBtn = document.getElementById('nav-accessories') as HTMLButtonElement;
const mainNavButtons = [navShoesBtn, navTshirtsBtn, navHoodiesBtn, navJacketsBtn, navPantsBtn, navSuitsBtn, navTraditionalBtn, navSportswearBtn, navAccessoriesBtn];

// Sub Navigation (Accessories)
const subNavAccessories = document.getElementById('sub-nav-accessories') as HTMLDivElement;
const navGlassesBtn = document.getElementById('nav-glasses') as HTMLButtonElement;
const navHatsBtn = document.getElementById('nav-hats') as HTMLButtonElement;
const navWatchesBtn = document.getElementById('nav-watches') as HTMLButtonElement;
const navBraceletsBtn = document.getElementById('nav-bracelets') as HTMLButtonElement;
const navBagsBtn = document.getElementById('nav-bags') as HTMLButtonElement;
const accessoriesSubNavButtons = [navGlassesBtn, navHatsBtn, navWatchesBtn, navBraceletsBtn, navBagsBtn];


// Dynamic Text
const toolTitle = document.getElementById('tool-title') as HTMLHeadingElement;
const toolDescription = document.getElementById('tool-description') as HTMLParagraphElement;
const itemUploaderTitle = document.getElementById('item-uploader-title') as HTMLHeadingElement;

// Model Uploader
const modelUploader = document.getElementById('model-uploader') as HTMLDivElement;
const modelFileInput = document.getElementById('model-file-input') as HTMLInputElement;
const modelPreview = document.getElementById('model-preview') as HTMLImageElement;
const modelRemoveBtn = document.querySelector('#model-uploader .remove-btn') as HTMLButtonElement;

// Item Uploader (for shoes, t-shirts, etc.)
const itemUploader = document.getElementById('item-uploader') as HTMLDivElement;
const itemFileInput = document.getElementById('item-file-input') as HTMLInputElement;
const itemPreview = document.getElementById('item-preview') as HTMLImageElement;
const itemRemoveBtn = document.querySelector('#item-uploader .remove-btn') as HTMLButtonElement;

// Controls
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const generateBtnText = generateBtn.querySelector('.button-text') as HTMLSpanElement;
const spinner = generateBtn.querySelector('.spinner') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLParagraphElement;

// Output
const outputPlaceholder = document.getElementById('output-placeholder') as HTMLDivElement;
const resultContainer = document.getElementById('result-container') as HTMLDivElement;
const resultImage = document.getElementById('result-image') as HTMLImageElement;
const downloadBtn = document.getElementById('download-btn') as HTMLAnchorElement;

// --- State Management ---
let modelImage: { base64: string; mimeType: string } | null = null;
let itemImage: { base64: string; mimeType: string } | null = null;
let isLoading = false;
let activeTool: Tool = 'shoes';

// --- Gemini API Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Helper Functions ---

/**
 * Converts a File object to a base64 encoded string.
 */
function fileToGenerativePart(file: File): Promise<{ base64: string, mimeType: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target!.result as string).split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Updates the UI state based on current application state.
 */
function updateUI() {
  // Update generate button state
  generateBtn.disabled = !modelImage || !itemImage || isLoading;

  // Update loading indicator
  if (isLoading) {
    spinner.style.display = 'block';
    generateBtnText.textContent = 'Generating...';
  } else {
    spinner.style.display = 'none';
    generateBtnText.textContent = 'Generate Image';
  }
}

/**
 * Sets up an image uploader element with drag-and-drop and click-to-upload.
 */
function setupUploader(
  uploaderElement: HTMLDivElement,
  fileInputElement: HTMLInputElement,
  previewElement: HTMLImageElement,
  removeBtnElement: HTMLButtonElement,
  onImageSet: (image: { base64: string; mimeType: string } | null) => void
) {
  const resetUploader = () => {
    fileInputElement.value = '';
    previewElement.src = '';
    uploaderElement.classList.remove('has-image');
    removeBtnElement.style.display = 'none';
    onImageSet(null);
    updateUI();
  };
  
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      statusText.textContent = 'Please upload a valid image file.';
      statusText.className = 'status-text error';
      return;
    }
    previewElement.src = URL.createObjectURL(file);
    uploaderElement.classList.add('has-image');
    removeBtnElement.style.display = 'flex';
    const imageData = await fileToGenerativePart(file);
    onImageSet(imageData);
    updateUI();
  };
  
  uploaderElement.addEventListener('click', (e) => {
    if (e.target !== removeBtnElement && !removeBtnElement.contains(e.target as Node)) {
        fileInputElement.click();
    }
  });

  fileInputElement.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  });

  uploaderElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploaderElement.classList.add('dragover');
  });

  uploaderElement.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploaderElement.classList.remove('dragover');
  });

  uploaderElement.addEventListener('drop', (e) => {
    e.preventDefault();
    uploaderElement.classList.remove('dragover');
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  });

  removeBtnElement.addEventListener('click', (e) => {
    e.stopPropagation();
    resetUploader();
  });

  // Return reset function to be called externally
  return resetUploader;
}


// --- Main Application Logic ---

const toolConfig = {
    shoes: {
        title: 'Virtual Shoe Try-On',
        description: 'Upload a photo of a model and a photo of shoes to see them combined!',
        itemTitle: 'Shoe Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their pose, clothing style, the overall atmosphere of the photo, and the environment. Pay close attention to their feet and legs: are they visible, what is their position and angle, and what kind of footwear, if any, are they wearing? This information will be used to realistically place a new pair of shoes on them.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the shoes from the second image onto the person in the first image. Use this analysis of the person's pose and style to guide you: "${analysisText}". The final image should be photorealistic. The lighting, shadows, and perspective of the new shoes must perfectly match the original photograph. Do not change the person or the background. Only replace the footwear.`
    },
    tshirts: {
        title: 'Virtual T-Shirt Try-On',
        description: 'Upload a photo of a model and a photo of a t-shirt to see them combined!',
        itemTitle: 'T-Shirt Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their pose, body shape, clothing style, the overall atmosphere of the photo, and the environment. Pay close attention to their torso and arms: are they visible, what is their position and angle, and what kind of top, if any, are they wearing? This information will be used to realistically place a new t-shirt on them.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the t-shirt from the second image onto the person in the first image. Use this analysis of the person's pose and style to guide you: "${analysisText}". The final image should be photorealistic. The lighting, shadows, and perspective of the new t-shirt must perfectly match the original photograph. Ensure the t-shirt fits naturally on the person's body. Do not change the person or the background. Only replace their upper body clothing.`
    },
    hoodies: {
        title: 'Virtual Hoodie/Sweatshirt Try-On',
        description: 'Upload a photo of a model and a photo of a hoodie or sweatshirt to see them combined!',
        itemTitle: 'Hoodie/Sweatshirt Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their pose, body shape, clothing style, the overall atmosphere of the photo, and the environment. Pay close attention to their torso, shoulders, arms, and head/neck area: are they visible, what is their position and angle, and what kind of top, if any, are they wearing? This information will be used to realistically place a new hoodie or sweatshirt on them, including how a hood might rest on their shoulders or head.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the hoodie or sweatshirt from the second image onto the person in the first image. Use this analysis of the person's pose and style to guide you: "${analysisText}". The final image should be photorealistic. The lighting, shadows, and perspective of the new top must perfectly match the original photograph. Ensure the hoodie/sweatshirt fits naturally on the person's body, paying attention to how a hood would drape. Do not change the person or the background. Only replace their upper body clothing.`
    },
    jackets: {
        title: 'Virtual Jacket/Coat Try-On',
        description: 'Upload a photo of a model and a photo of a jacket or coat to see them combined!',
        itemTitle: 'Jacket/Coat Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their pose, body shape, and current clothing. Pay close attention to their torso, shoulders, and arms, noting their position and angle. This information will be used to realistically place a new jacket or coat over their current attire, ensuring it drapes correctly and fits their build.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the jacket or coat from the second image onto the person in the first image, placing it over their existing clothes. Use this analysis of the person's pose and style to guide you: "${analysisText}". The final image should be photorealistic. The lighting, shadows, and perspective of the new outerwear must perfectly match the original photograph. Ensure the jacket/coat fits naturally on the person's body, paying attention to details like collars and how it hangs. Do not change the person, their inner clothes, or the background. Only add the jacket/coat as the outermost layer.`
    },
    pants: {
        title: 'Virtual Pants Try-On',
        description: 'Upload a photo of a model and a photo of pants to see them combined!',
        itemTitle: 'Pants Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their pose, body shape, clothing style, the overall atmosphere of the photo, and the environment. Pay close attention to their lower body, waist, and legs: are they visible, what is their position and angle, and what kind of trousers/skirt, if any, are they wearing? This information will be used to realistically place a new pair of pants on them.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the pants from the second image onto the person in the first image. Use this analysis of the person's pose and style to guide you: "${analysisText}". The final image should be photorealistic. The lighting, shadows, and perspective of the new pants must perfectly match the original photograph. Ensure the pants fit naturally on the person's body from the waist down. Do not change the person or the background. Only replace their lower body clothing.`
    },
    suits: {
        title: 'Virtual Suit Try-On',
        description: 'Upload a photo of a model and a photo of a suit to see them combined!',
        itemTitle: 'Suit Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their pose, body build (shoulders, chest, waist), clothing style, the overall atmosphere of the photo, and the environment. Pay close attention to their entire figure, from shoulders to legs. Note the position of their arms and torso, and what kind of clothing they are currently wearing. This information will be used to realistically place a new suit (jacket and trousers) on them.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the suit from the second image onto the person in the first image. Use this analysis of the person's pose and build to guide you: "${analysisText}". The final image should be photorealistic. The suit jacket should fit naturally over their torso and arms, and the trousers should fit their legs. The lighting, shadows, and perspective of the new suit must perfectly match the original photograph. Do not change the person or the background. Only replace their clothing with the complete suit.`
    },
    traditional: {
        title: 'Virtual Traditional Wear Try-On',
        description: 'For garments like kurtas, abayas, saris, etc. Upload a model photo and a photo of the item.',
        itemTitle: 'Garment Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their pose, body shape, and full body posture. Pay close attention to their shoulders, torso, waist, and legs, noting their position and angles. Consider the overall context and style. This information is crucial for realistically draping a traditional garment, which might be a flowing abaya, a wrapped sari, or a structured kurta, onto their figure.`,
        generationPrompt: (analysisText: string) => `You are an expert cultural fashion editor. Your task is to seamlessly photoshop the traditional garment from the second image onto the person in the first image. Use this analysis of the person's pose and build to guide you: "${analysisText}". The final image should be photorealistic and culturally respectful. The lighting, shadows, and perspective of the new garment must perfectly match the original photograph. Ensure the garment drapes and fits naturally according to its specific type (e.g., a sari's pleats, a kurta's fit). Do not change the person or the background. Only replace their clothing with the traditional wear.`
    },
    sportswear: {
        title: 'Virtual Sportswear Try-On',
        description: 'Try on gym outfits, jerseys, and other athletic apparel.',
        itemTitle: 'Sportswear Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their pose, body build, and current clothing. Pay close attention to their torso, shoulders, and legs, noting their position and any athletic posture. This information will be used to realistically fit sportswear like a gym outfit or a jersey onto them.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor specializing in athletic apparel. Your task is to seamlessly photoshop the sportswear from the second image onto the person in the first image. Use this analysis of the person's pose and build to guide you: "${analysisText}". The final image should be photorealistic. Ensure the sportswear fits naturally for an active context, showing how the fabric would stretch or hang. The lighting, shadows, and perspective of the new apparel must perfectly match the original photograph. Do not change the person or the background. Only replace their clothing with the sportswear.`
    },
    glasses: {
        title: 'Virtual Glasses/Sunglasses Try-On',
        description: 'Upload a photo of a model and a photo of eyewear to see them combined!',
        itemTitle: 'Eyewear Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their face shape, the position of their eyes, nose, and ears, and the angle of their head. This information will be used to realistically place glasses or sunglasses on their face.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the glasses/sunglasses from the second image onto the person's face in the first image. Use this analysis of the person's face and head position to guide you: "${analysisText}". The final image should be photorealistic. Ensure the eyewear sits correctly on the nose and ears, and that the perspective matches the head's angle. Do not change any other part of the person or background.`
    },
    hats: {
        title: 'Virtual Hat/Cap Try-On',
        description: 'Upload a photo of a model and a photo of a hat or cap to see them combined!',
        itemTitle: 'Hat/Cap Image',
        analysisPrompt: `Analyze the provided image of a person. Describe their head shape, hairstyle, and the angle they are facing. This information will be used to realistically place a hat or cap on their head.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the hat/cap from the second image onto the person's head in the first image. Use this analysis of the person's head and hairstyle to guide you: "${analysisText}". The final image should be photorealistic. The hat must fit naturally, casting appropriate shadows on the face and hair. Do not change the person or background.`
    },
    watches: {
        title: 'Virtual Watch Try-On',
        description: 'Upload a photo of a model and a photo of a watch to see it on their wrist!',
        itemTitle: 'Watch Image',
        analysisPrompt: `Analyze the provided image of a person. Pay close attention to their wrists and hands, noting their position, angle, and whether they are visible. This information will be used to realistically place a watch on their wrist.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the watch from the second image onto the person's wrist in the first image. Use this analysis of the person's arm and wrist to guide you: "${analysisText}". The watch should fit snugly and be oriented correctly based on the arm's position. Match lighting and shadows perfectly. Do not change any other part of the person or background.`
    },
    bracelets: {
        title: 'Virtual Bracelet Try-On',
        description: 'Upload a photo of a model and a photo of a bracelet to see it on their wrist!',
        itemTitle: 'Bracelet Image',
        analysisPrompt: `Analyze the provided image of a person. Pay close attention to their wrists and forearms, noting their position, angle, and whether they are visible. This information will be used to realistically place a bracelet on their wrist.`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the bracelet from the second image onto the person's wrist in the first image. Use this analysis of the person's arm and wrist to guide you: "${analysisText}". The bracelet should drape or fit naturally depending on its style. Match lighting and shadows perfectly. Do not change any other part of the person or background.`
    },
    bags: {
        title: 'Virtual Bag Try-On',
        description: 'Upload a photo of a model and a photo of a bag to see them combined!',
        itemTitle: 'Bag Image',
        analysisPrompt: `Analyze the provided image of a person's full-body pose. Describe how they are standing or sitting, the position of their arms, hands, and shoulders. This information will determine the most natural way to place a bag (e.g., held in hand, on the shoulder, or crossbody).`,
        generationPrompt: (analysisText: string) => `You are an expert photo editor. Your task is to seamlessly photoshop the bag from the second image onto the person in the first image. Use this analysis of the person's pose to guide you: "${analysisText}". Place the bag in a natural position—either held, on the shoulder, or across the body. Ensure straps and handles interact realistically with their clothing and body. Match lighting and shadows. Do not change the person or background.`
    }
};

const toolCategoryMap: Record<Tool, HTMLButtonElement> = {
    shoes: navShoesBtn,
    tshirts: navTshirtsBtn,
    hoodies: navHoodiesBtn,
    jackets: navJacketsBtn,
    pants: navPantsBtn,
    suits: navSuitsBtn,
    traditional: navTraditionalBtn,
    sportswear: navSportswearBtn,
    glasses: navAccessoriesBtn,
    hats: navAccessoriesBtn,
    watches: navAccessoriesBtn,
    bracelets: navAccessoriesBtn,
    bags: navAccessoriesBtn,
};

function renderToolUI(tool: Tool) {
    const config = toolConfig[tool];
    toolTitle.textContent = config.title;
    toolDescription.textContent = config.description;
    itemUploaderTitle.textContent = config.itemTitle;

    // Show/hide accessories sub-nav
    const isAccessory = tool in toolCategoryMap && toolCategoryMap[tool] === navAccessoriesBtn;
    subNavAccessories.style.display = isAccessory ? 'flex' : 'none';

    // Update main navigation button states
    mainNavButtons.forEach(btn => {
        btn.classList.toggle('active', toolCategoryMap[tool] === btn);
    });
    
    // Update accessories sub-navigation button states
    if (isAccessory) {
        navGlassesBtn.classList.toggle('active', tool === 'glasses');
        navHatsBtn.classList.toggle('active', tool === 'hats');
        navWatchesBtn.classList.toggle('active', tool === 'watches');
        navBraceletsBtn.classList.toggle('active', tool === 'bracelets');
        navBagsBtn.classList.toggle('active', tool === 'bags');
    }
}

async function handleGenerateClick() {
  if (!modelImage || !itemImage || isLoading) {
    return;
  }

  isLoading = true;
  updateUI();
  statusText.textContent = 'Analyzing model image...';
  statusText.className = 'status-text';
  outputPlaceholder.style.display = 'flex';
  resultContainer.style.display = 'none';
  
  try {
    const config = toolConfig[activeTool];

    // Step 1: Analyze the model image to generate a descriptive prompt.
    const analysisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [
            { text: config.analysisPrompt },
            { inlineData: { data: modelImage.base64, mimeType: modelImage.mimeType }}
        ]}
    });

    const analysisText = analysisResponse.text;
    statusText.textContent = 'Generating final image...';

    // Step 2: Use the analysis to guide the image editing model.
    const generationPrompt = config.generationPrompt(analysisText);

    const imageEditResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: generationPrompt },
            { inlineData: { data: modelImage.base64, mimeType: modelImage.mimeType }},
            { inlineData: { data: itemImage.base64, mimeType: itemImage.mimeType }}
        ]},
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    // Find and display the generated image from the response.
    const imagePart = imageEditResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart && imagePart.inlineData) {
        const generatedImageBase64 = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;
        const imageUrl = `data:${mimeType};base64,${generatedImageBase64}`;
        resultImage.src = imageUrl;
        downloadBtn.href = imageUrl;
        
        outputPlaceholder.style.display = 'none';
        resultContainer.style.display = 'flex';
        statusText.textContent = 'Generation complete!';
    } else {
      throw new Error('Could not find a generated image in the API response.');
    }

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    statusText.textContent = `Error: ${errorMessage}`;
    statusText.className = 'status-text error';
  } finally {
    isLoading = false;
    updateUI();
  }
}


// --- Event Listener Setup ---

document.addEventListener('DOMContentLoaded', () => {
    const resetModelUploader = setupUploader(modelUploader, modelFileInput, modelPreview, modelRemoveBtn, (image) => {
        modelImage = image;
    });
    const resetItemUploader = setupUploader(itemUploader, itemFileInput, itemPreview, itemRemoveBtn, (image) => {
        itemImage = image;
    });

    function switchTool(tool: Tool) {
        activeTool = tool;
        renderToolUI(tool);
        // Reset state when switching
        resetModelUploader();
        resetItemUploader();
        statusText.textContent = '';
        statusText.className = 'status-text';
        outputPlaceholder.style.display = 'flex';
        resultContainer.style.display = 'none';
    }

    navShoesBtn.addEventListener('click', () => switchTool('shoes'));
    navTshirtsBtn.addEventListener('click', () => switchTool('tshirts'));
    navHoodiesBtn.addEventListener('click', () => switchTool('hoodies'));
    navJacketsBtn.addEventListener('click', () => switchTool('jackets'));
    navPantsBtn.addEventListener('click', () => switchTool('pants'));
    navSuitsBtn.addEventListener('click', () => switchTool('suits'));
    navTraditionalBtn.addEventListener('click', () => switchTool('traditional'));
    navSportswearBtn.addEventListener('click', () => switchTool('sportswear'));
    navAccessoriesBtn.addEventListener('click', () => switchTool('glasses')); // Default to glasses

    navGlassesBtn.addEventListener('click', () => switchTool('glasses'));
    navHatsBtn.addEventListener('click', () => switchTool('hats'));
    navWatchesBtn.addEventListener('click', () => switchTool('watches'));
    navBraceletsBtn.addEventListener('click', () => switchTool('bracelets'));
    navBagsBtn.addEventListener('click', () => switchTool('bags'));

    generateBtn.addEventListener('click', handleGenerateClick);
    
    // Initial render
    renderToolUI(activeTool);
});

export {};