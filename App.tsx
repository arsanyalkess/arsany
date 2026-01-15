
import React, { useState } from 'react';
import { ProjectState, INITIAL_STATE, TargetPlatform } from './types';
import Layout from './components/Layout';
import OptionGroup from './components/OptionGroup';
import ImageUploader from './components/ImageUploader';
import { translations } from './translations';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [state, setState] = useState<ProjectState>(INITIAL_STATE);

  const t = translations[lang];

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ar' : 'en');

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeImage = async (section: keyof ProjectState, file: File) => {
    try {
      setState(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] as any),
          image: { ...(prev[section] as any).image, isAnalyzing: true }
        }
      }));

      const base64Data = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let analysisPrompt = "";
      switch (section) {
        case 'environment':
          analysisPrompt = "You are a senior fashion set analyst. Analyze the uploaded image and describe ONLY the environment and lighting. Focus on: setting type, lighting atmosphere, color temperature, and spatial depth. Ignore people and clothing. Be extremely concise and professional.";
          break;
        case 'model':
          analysisPrompt = "You are a senior fashion casting analyst. Analyze the uploaded image and describe ONLY the model's appearance. Focus on: facial structure, skin appearance/texture, and body proportions. STRICTLY ignore clothing and background. Be professional and concise.";
          break;
        case 'outfit':
          analysisPrompt = `You are a senior fashion product analyst. 
Analyze the uploaded image and describe ONLY the clothing item in extreme detail. 
You MUST:
- Identify the exact garment type (e.g. evening dress, blazer, jacket).
- Identify the PRIMARY color precisely (not general).
- Describe the fabric appearance and finish.
- Describe the cut, silhouette, and structure.
- Describe all visible design details.

STRICT RULES:
- Do NOT describe the model.
- Do NOT describe the face or body.
- Do NOT describe the background.
- Do NOT invent or assume details.
- If something is unclear, describe only what is visible.

Return the result as a professional fashion product description.`;
          break;
        case 'pose':
          analysisPrompt = "You are a senior fashion pose analyst. Analyze the uploaded image and describe ONLY the model's body posture, limb positioning, and movement. Ignore clothing and background. Be concise.";
          break;
        case 'lighting':
          analysisPrompt = "You are a senior fashion lighting technician. Analyze the uploaded image and describe ONLY the lighting style and camera setup. Focus on light direction, intensity, and technical photography framing. Be concise.";
          break;
        default:
          analysisPrompt = "Describe visual characteristics relevant to high-end professional fashion photography.";
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: file.type } },
            { text: analysisPrompt }
          ]
        }
      });

      const description = response.text || "";

      setState(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] as any),
          image: { 
            ...(prev[section] as any).image, 
            analysisText: description.trim(), 
            isAnalyzing: false 
          }
        }
      }));
    } catch (error) {
      console.error("Analysis error:", error);
      setState(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] as any),
          image: { ...(prev[section] as any).image, isAnalyzing: false }
        }
      }));
    }
  };

  const updateImage = (section: keyof ProjectState, file: File | null) => {
    const previewUrl = file ? URL.createObjectURL(file) : null;
    setState(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        image: {
          ...(prev[section] as any).image,
          file,
          previewUrl,
          analysisText: null,
          isAnalyzing: false
        }
      }
    }));

    if (file) {
      analyzeImage(section, file);
    }
  };

  const toggleImageActive = (section: keyof ProjectState) => {
    setState(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        image: {
          ...(prev[section] as any).image,
          isActive: !(prev[section] as any).image.isActive
        }
      }
    }));
  };

  const generatePrompt = () => {
    const s = state;
    
    // 1. ENVIRONMENT
    let envBase = "";
    if (s.environment.sceneType === 'Studio') envBase = "clean professional fashion studio environment, neutral seamless background, controlled lighting setup designed for skin tone accuracy";
    else if (s.environment.sceneType === 'Runway') envBase = "fashion runway environment with dramatic stage lighting, dark surroundings emphasizing the model silhouette";
    else if (s.environment.sceneType === 'Street') envBase = "urban fashion environment with natural daylight, realistic shadows and textured surroundings";
    else envBase = `${s.environment.sceneType} fashion setting, ${s.environment.mood} atmosphere`;

    const envPart = s.environment.image.isActive && s.environment.image.analysisText
      ? `environment inspired by the reference image with matching lighting mood and spatial depth: ${s.environment.image.analysisText}, ${envBase}`
      : envBase;

    // 2. MODEL (MAGIC LAYER)
    const skinRealism = "natural realistic skin texture with visible pores, soft subsurface scattering, luxurious healthy skin with refined texture, no plastic or waxy appearance";
    const facialBase = `well-defined facial features, balanced proportions, natural facial symmetry, editorial fashion model aesthetics, ${s.model.facialStyle} look`;
    const bodyBase = `slim elegant body proportions, natural posture with relaxed shoulders, balanced anatomy suitable for high-fashion photography`;
    const modelCore = `${s.model.gender}, age ${s.model.ageRange}, ${s.model.skinTone} skin tone accurately preserved under professional fashion lighting, ${s.model.hairStyle} hair`;
    
    const modelPart = s.model.image.isActive && s.model.image.analysisText
      ? `model appearance based on the reference image (do not replicate clothing from the model reference), preserving facial structure and skin characteristics: ${s.model.image.analysisText}, ${skinRealism}, ${facialBase}, ${bodyBase}, ${modelCore}`
      : `${skinRealism}, ${facialBase}, ${bodyBase}, ${modelCore}`;

    // 3. OUTFIT (HARD LOCK LOGIC)
    let outfitPart = "";
    const manualOutfit = `${s.outfit.colorPalette} ${s.outfit.fabric} ${s.outfit.garmentType}, ${s.outfit.cut} cut, ${s.outfit.texture} finish, ${s.outfit.details}, exact garment color preserved`;
    
    if (s.outfit.image.isActive && s.outfit.image.analysisText) {
      // IMAGE ANALYSIS OVERRIDES MANUAL INPUT
      outfitPart = `wearing a ${s.outfit.image.analysisText}, design, color, and fabric strictly based on the analyzed clothing reference, the garment color, fabric, and design must not be altered, high-end construction`;
    } else {
      outfitPart = manualOutfit;
    }

    // 4. POSE & MOOD
    let poseBase = "";
    if (s.pose.bodyPose === 'Standing') poseBase = "confident upright posture, body weight evenly distributed, slight natural curve in the spine, relaxed shoulders enhancing garment drape";
    else if (s.pose.bodyPose === 'Walking') poseBase = "dynamic walking pose with forward motion, natural leg movement, fabric flowing naturally with motion";
    else poseBase = `pose: ${s.pose.bodyPose}, ${s.pose.fabricMovement} fabric movement, ${s.pose.facialExpression} facial expression, ${s.pose.fashionMood} mood`;

    const posePart = s.pose.image.isActive && s.pose.image.analysisText
      ? `pose and movement inspired by the reference image: ${s.pose.image.analysisText}, ${poseBase}, editorial fashion attitude`
      : `${poseBase}, editorial fashion attitude`;

    // 5. LIGHTING & CAMERA
    let lightBase = "";
    if (s.lighting.lightingType === 'Soft Box') lightBase = "soft diffused studio lighting, even illumination across the face, gentle shadows enhancing facial depth, optimized for realistic skin rendering";
    else if (s.lighting.lightingType === 'Chiaroscuro') lightBase = "directional lighting with controlled contrast, highlighting facial structure and fabric texture";
    else lightBase = `${s.lighting.lightingType} lighting, ${s.lighting.shadowIntensity} shadows, ${s.lighting.shotType} framing`;

    const lightingPart = s.lighting.image.isActive && s.lighting.image.analysisText
      ? `lighting and camera style inspired by the reference image: ${s.lighting.image.analysisText}, ${lightBase}, ${s.lighting.lens} lens, shallow depth of field`
      : `${lightBase}, ${s.lighting.lens} lens, shallow depth of field`;

    // 6. QUALITY
    const qualityPart = `ultra high resolution, hyper-realistic fashion photography, editorial magazine quality, cinematic color grading, ${s.quality.realismLevel}`;

    return [
      `High-fashion editorial image of a ${modelPart}`,
      `wearing an ${outfitPart}`,
      `${posePart}`,
      `${envPart}`,
      `${lightingPart}`,
      `${qualityPart}`
    ].join(',\n');
  };

  const getNegativePrompt = () => {
    const base = "plastic skin, waxy skin, over-smoothed face, blurry, bad anatomy, distorted proportions, low quality, duplicate limbs, text, watermark, signature";
    const garmentLock = "do not change garment color, no black dress, no different fabric, no redesign, no pattern changes, no additional details, no color variation";
    
    if (state.outfit.image.isActive && state.outfit.image.previewUrl) {
      return `${base}, ${garmentLock}, wrong clothing color, mismatched fabric`;
    }
    return base;
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 w-16 h-16 border border-white/20 flex items-center justify-center rotate-45">
              <i className="fa-solid fa-plus -rotate-45 text-white/50"></i>
            </div>
            <h2 className="text-xl tracking-[0.2em] uppercase font-light mb-8">{t.startNew}</h2>
            <div className="w-full space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t.projectName}</label>
                <input 
                  type="text" 
                  value={state.projectName}
                  onChange={(e) => setState({ ...state, projectName: e.target.value })}
                  placeholder={t.projectPlaceholder}
                  className="w-full bg-transparent border-b border-white/20 py-3 text-center focus:border-white transition-colors outline-none tracking-widest uppercase text-sm"
                />
              </div>
              <OptionGroup 
                label={t.targetPlatform}
                options={['Midjourney', 'Stable Diffusion', 'Other']}
                currentValue={state.targetPlatform}
                onChange={(val) => setState({ ...state, targetPlatform: val as TargetPlatform })}
              />
              <button 
                onClick={nextStep}
                disabled={!state.projectName}
                className="w-full bg-white text-black py-4 mt-8 uppercase tracking-[0.3em] text-xs font-bold hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {t.enterStudio}
              </button>
            </div>
          </div>
        );

      case 1: // Environment
        return (
          <div className="space-y-4">
            <h2 className="text-sm tracking-[0.3em] uppercase mb-8 pb-4 border-b border-white/10">{t.steps[1]}</h2>
            <OptionGroup label={t.labels.sceneType} options={['Studio', 'Runway', 'Street', 'Luxury Interior', 'Outdoor']} currentValue={state.environment.sceneType} onChange={(v) => setState({...state, environment: {...state.environment, sceneType: v}})} />
            <OptionGroup label={t.labels.mood} options={['Clean', 'Dramatic', 'Minimal', 'Luxury']} currentValue={state.environment.mood} onChange={(v) => setState({...state, environment: {...state.environment, mood: v}})} />
            <ImageUploader label={`${t.uploadRef} ${t.optional}`} imageData={state.environment.image} onUpload={(f) => updateImage('environment', f)} onClear={() => updateImage('environment', null)} lang={lang} />
            <div className="flex gap-4 pt-8">
              <button onClick={prevStep} className="flex-1 py-4 border border-white/10 uppercase tracking-widest text-[10px] hover:bg-white/5">{t.back}</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-white text-black uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200">{t.next}</button>
            </div>
          </div>
        );

      case 2: // Model
        return (
          <div className="space-y-4">
            <h2 className="text-sm tracking-[0.3em] uppercase mb-8 pb-4 border-b border-white/10">{t.steps[2]}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <OptionGroup label={t.labels.gender} options={['Female', 'Male', 'Non-binary']} currentValue={state.model.gender} onChange={(v) => setState({...state, model: {...state.model, gender: v}})} />
              <OptionGroup label={t.labels.age} options={['18-25', '25-35', '35-50', 'Senior']} currentValue={state.model.ageRange} onChange={(v) => setState({...state, model: {...state.model, ageRange: v}})} />
              <OptionGroup label={t.labels.bodyType} options={['Slim', 'Athletic', 'Curvy', 'Tailored']} currentValue={state.model.bodyType} onChange={(v) => setState({...state, model: {...state.model, bodyType: v}})} />
              <OptionGroup label={t.labels.skinTone} options={['Fair', 'Natural', 'Olive', 'Deep']} currentValue={state.model.skinTone} onChange={(v) => setState({...state, model: {...state.model, skinTone: v}})} />
            </div>
            <OptionGroup label={t.labels.facialStyle} options={['Editorial', 'High Fashion', 'Commercial', 'Avant-Garde']} currentValue={state.model.facialStyle} onChange={(v) => setState({...state, model: {...state.model, facialStyle: v}})} />
            <OptionGroup label={t.labels.hairStyle} options={['Sleek Back', 'Flowing', 'Sculptural', 'Minimal']} currentValue={state.model.hairStyle} onChange={(v) => setState({...state, model: {...state.model, hairStyle: v}})} />
            <ImageUploader label={`${t.uploadRef} ${t.crucial}`} imageData={state.model.image} onUpload={(f) => updateImage('model', f)} onClear={() => updateImage('model', null)} lang={lang} />
            <div className="flex gap-4 pt-8">
              <button onClick={prevStep} className="flex-1 py-4 border border-white/10 uppercase tracking-widest text-[10px] hover:bg-white/5">{t.back}</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-white text-black uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200">{t.next}</button>
            </div>
          </div>
        );

      case 3: // Outfit
        const isOutfitLocked = !!(state.outfit.image.isActive && state.outfit.image.analysisText);
        return (
          <div className="space-y-4">
            <h2 className="text-sm tracking-[0.3em] uppercase mb-2 pb-4 border-b border-white/10">{t.steps[3]}</h2>
            {isOutfitLocked && (
              <div className="bg-white/5 border border-white/20 p-4 mb-6 text-[10px] uppercase tracking-widest text-white/60 flex items-center gap-3">
                <i className="fa-solid fa-lock text-white"></i>
                <span>{lang === 'ar' ? 'تم قفل خصائص القطعة بناءً على الصورة المرجعية' : 'Outfit attributes locked from reference image'}</span>
              </div>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-8 transition-opacity duration-500 ${isOutfitLocked ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <OptionGroup label={t.labels.garment} options={['Gown', 'Suit', 'Streetwear', 'Avant-Garde']} currentValue={state.outfit.garmentType} onChange={(v) => setState({...state, outfit: {...state.outfit, garmentType: v}})} />
              <OptionGroup label={t.labels.cut} options={['Oversized', 'Fitted', 'Draped', 'Structural']} currentValue={state.outfit.cut} onChange={(v) => setState({...state, outfit: {...state.outfit, cut: v}})} />
              <OptionGroup label={t.labels.fabric} options={['Silk', 'Leather', 'Denim', 'Latex', 'Wool']} currentValue={state.outfit.fabric} onChange={(v) => setState({...state, outfit: {...state.outfit, fabric: v}})} />
              <OptionGroup label={t.labels.texture} options={['Glossy', 'Matte', 'Crinkled', 'Embossed']} currentValue={state.outfit.texture} onChange={(v) => setState({...state, outfit: {...state.outfit, texture: v}})} />
              <OptionGroup label={t.labels.colorPalette} options={['Monochrome', 'Earth Tones', 'Vibrant', 'Metallics']} currentValue={state.outfit.colorPalette} onChange={(v) => setState({...state, outfit: {...state.outfit, colorPalette: v}})} />
              <OptionGroup label={t.labels.details} options={['Embroidery', 'Buttons', 'Zippers', 'Lace', 'Minimal']} currentValue={state.outfit.details} onChange={(v) => setState({...state, outfit: {...state.outfit, details: v}})} />
            </div>
            <ImageUploader label={`${t.uploadRef} ${t.primary}`} imageData={state.outfit.image} onUpload={(f) => updateImage('outfit', f)} onClear={() => updateImage('outfit', null)} lang={lang} />
            <div className="flex gap-4 pt-8">
              <button onClick={prevStep} className="flex-1 py-4 border border-white/10 uppercase tracking-widest text-[10px] hover:bg-white/5">{t.back}</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-white text-black uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200">{t.next}</button>
            </div>
          </div>
        );

      case 4: // Pose
        return (
          <div className="space-y-4">
            <h2 className="text-sm tracking-[0.3em] uppercase mb-8 pb-4 border-b border-white/10">{t.steps[4]}</h2>
            <OptionGroup label={t.labels.bodyPose} options={['Standing', 'Walking', 'Sitting', 'Dynamic']} currentValue={state.pose.bodyPose} onChange={(v) => setState({...state, pose: {...state.pose, bodyPose: v}})} />
            <OptionGroup label={t.labels.fabricMovement} options={['Static', 'Flowing', 'Whip-like', 'Billowing']} currentValue={state.pose.fabricMovement} onChange={(v) => setState({...state, pose: {...state.pose, fabricMovement: v}})} />
            <OptionGroup label={t.labels.facialExpression} options={['Confident', 'Neutral', 'Seductive', 'Intense']} currentValue={state.pose.facialExpression} onChange={(v) => setState({...state, pose: {...state.pose, facialExpression: v}})} />
            <OptionGroup label={t.labels.fashionMood} options={['Bold', 'Soft', 'Editorial', 'Dark']} currentValue={state.pose.fashionMood} onChange={(v) => setState({...state, pose: {...state.pose, fashionMood: v}})} />
            <ImageUploader label={`${t.uploadRef} ${t.optional}`} imageData={state.pose.image} onUpload={(f) => updateImage('pose', f)} onClear={() => updateImage('pose', null)} lang={lang} />
            <div className="flex gap-4 pt-8">
              <button onClick={prevStep} className="flex-1 py-4 border border-white/10 uppercase tracking-widest text-[10px] hover:bg-white/5">{t.back}</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-white text-black uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200">{t.next}</button>
            </div>
          </div>
        );

      case 5: // Lighting
        return (
          <div className="space-y-4">
            <h2 className="text-sm tracking-[0.3em] uppercase mb-8 pb-4 border-b border-white/10">{t.steps[5]}</h2>
            <OptionGroup label={t.labels.lightingType} options={['Soft Box', 'Hard Rim', 'High Key', 'Chiaroscuro']} currentValue={state.lighting.lightingType} onChange={(v) => setState({...state, lighting: {...state.lighting, lightingType: v}})} />
            <OptionGroup label={t.labels.shadows} options={['None', 'Subtle', 'Deep', 'Dramatic']} currentValue={state.lighting.shadowIntensity} onChange={(v) => setState({...state, lighting: {...state.lighting, shadowIntensity: v}})} />
            <OptionGroup label={t.labels.lens} options={['35mm', '50mm', '85mm', '105mm']} currentValue={state.lighting.lens} onChange={(v) => setState({...state, lighting: {...state.lighting, lens: v}})} />
            <OptionGroup label={t.labels.shotType} options={['Full Body', 'Medium Shot', 'Close-Up', 'Extreme Close-Up']} currentValue={state.lighting.shotType} onChange={(v) => setState({...state, lighting: {...state.lighting, shotType: v}})} />
            <ImageUploader label={`${t.uploadRef} ${t.optional}`} imageData={state.lighting.image} onUpload={(f) => updateImage('lighting', f)} onClear={() => updateImage('lighting', null)} lang={lang} />
            <div className="flex gap-4 pt-8">
              <button onClick={prevStep} className="flex-1 py-4 border border-white/10 uppercase tracking-widest text-[10px] hover:bg-white/5">{t.back}</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-white text-black uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200">{t.next}</button>
            </div>
          </div>
        );

      case 6: // Quality
        return (
          <div className="space-y-4">
            <h2 className="text-sm tracking-[0.3em] uppercase mb-8 pb-4 border-b border-white/10">{t.steps[6]}</h2>
            <OptionGroup label={t.labels.realism} options={['Hyper-realistic', 'Cinematic', 'Painterly', 'Raw Photography']} currentValue={state.quality.realismLevel} onChange={(v) => setState({...state, quality: {...state.quality, realismLevel: v}})} />
            <OptionGroup label={t.labels.style} options={['Editorial', 'Commercial', 'Catalog', 'High Fashion']} currentValue={state.quality.style} onChange={(v) => setState({...state, quality: {...state.quality, style: v}})} />
            <OptionGroup label={t.labels.outputQuality} options={['8K UHD', '4K Masterpiece', 'Film Grain', 'Ultra HD']} currentValue={state.quality.imageQuality} onChange={(v) => setState({...state, quality: {...state.quality, imageQuality: v}})} />
            <div className="flex gap-4 pt-12">
              <button onClick={prevStep} className="flex-1 py-4 border border-white/10 uppercase tracking-widest text-[10px] hover:bg-white/5">{t.back}</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-white text-black uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200">{t.compile}</button>
            </div>
          </div>
        );

      case 7: // Output
        const finalPrompt = generatePrompt();
        const negativePrompt = getNegativePrompt();
        
        return (
          <div className="space-y-8 animate-in fade-in duration-700">
            <h2 className="text-sm tracking-[0.3em] uppercase mb-8 pb-4 border-b border-white/10">{t.steps[7]}</h2>
            
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500">{t.masterPrompt}</label>
              <div className="p-6 glass-card border border-white/10 relative group">
                <p className="text-sm text-gray-300 leading-relaxed font-light whitespace-pre-wrap">{finalPrompt}</p>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(finalPrompt);
                      alert(t.promptCopied);
                    }}
                    className="text-[10px] uppercase tracking-widest text-white hover:underline flex items-center gap-2"
                  >
                    <i className="fa-regular fa-copy"></i> {t.copyPrompt}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500">{t.negativePrompt}</label>
              <div className="p-4 glass-card border border-white/5">
                <p className="text-[11px] text-gray-500 leading-relaxed italic">{negativePrompt}</p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-6">{t.referencedAssets}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(['environment', 'model', 'outfit', 'pose', 'lighting'] as const).map((key) => {
                  const item = state[key];
                  if (!item.image.previewUrl) return null;
                  return (
                    <div key={key} className={`relative group transition-opacity duration-300 ${!item.image.isActive ? 'opacity-30' : 'opacity-100'}`}>
                      <img src={item.image.previewUrl} className="w-full h-24 object-cover border border-white/10" alt={key} />
                      <div className="mt-2 text-[8px] uppercase tracking-widest text-gray-600 truncate">{item.image.role}</div>
                      <button 
                        onClick={() => toggleImageActive(key)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center text-[10px] border border-black/10 shadow-lg"
                      >
                        <i className={`fa-solid ${item.image.isActive ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 pt-12">
              <button 
                onClick={() => setStep(0)} 
                className="flex-1 py-4 border border-white/10 uppercase tracking-widest text-[10px] hover:bg-white/5"
              >
                {t.newProject}
              </button>
              <button 
                className="flex-[2] py-4 bg-white text-black uppercase tracking-widest text-[10px] font-bold hover:bg-gray-200"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `${state.projectName || 'project'}_fabusse.json`);
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
              >
                {t.exportData}
              </button>
            </div>
            
            <p className="text-center text-[8px] text-gray-600 uppercase tracking-widest pt-4 italic">
              Generated by FABUSSE – Fashion AI Studio
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout currentStep={step} totalSteps={8} lang={lang} onLangToggle={toggleLanguage}>
      {renderStep()}
    </Layout>
  );
};

export default App;
