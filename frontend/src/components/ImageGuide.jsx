import React from 'react';

const ImageGuide = () => {
  const dummyImages = {
    frontView: 'https://via.placeholder.com/800x600/9333EA/FFFFFF?text=Front+View',
    backView: 'https://via.placeholder.com/800x600/9333EA/FFFFFF?text=Back+View',
    sideView: 'https://via.placeholder.com/800x600/9333EA/FFFFFF?text=Side+View',
    meterPhoto: 'https://via.placeholder.com/800x600/9333EA/FFFFFF?text=Meter+Photo',
    scratches: 'https://via.placeholder.com/800x600/F97316/FFFFFF?text=Scratches'
  };

  return (
    <div className="bg-neutral-100 p-6 rounded-lg mt-6">
      <h3 className="text-lg font-semibold mb-4">📸 Required Images Guide</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Upload 4-5 mandatory images for your bike listing. Here are examples:
      </p>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium mb-2">1. Front View (Required)</p>
          <img 
            src={dummyImages.frontView} 
            alt="Front View Example" 
            className="w-full h-32 object-cover rounded-lg border-2 border-primary-200"
          />
          <p className="text-xs text-neutral-500 mt-1">Shows front of the bike</p>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">2. Back View (Required)</p>
          <img 
            src={dummyImages.backView} 
            alt="Back View Example" 
            className="w-full h-32 object-cover rounded-lg border-2 border-primary-200"
          />
          <p className="text-xs text-neutral-500 mt-1">Shows rear of the bike</p>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">3. Side View (Required)</p>
          <img 
            src={dummyImages.sideView} 
            alt="Side View Example" 
            className="w-full h-32 object-cover rounded-lg border-2 border-primary-200"
          />
          <p className="text-xs text-neutral-500 mt-1">Shows side profile</p>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">4. Meter Photo (Required)</p>
          <img 
            src={dummyImages.meterPhoto} 
            alt="Meter Photo Example" 
            className="w-full h-32 object-cover rounded-lg border-2 border-primary-200"
          />
          <p className="text-xs text-neutral-500 mt-1">Shows odometer/mileage</p>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">5. Scratches (Optional)</p>
          <img 
            src={dummyImages.scratches} 
            alt="Scratches Example" 
            className="w-full h-32 object-cover rounded-lg border-2 border-accent-200"
          />
          <p className="text-xs text-neutral-500 mt-1">Any existing damage</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-neutral-200">
        <p className="text-sm font-semibold mb-2">📋 Image Requirements:</p>
        <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
          <li>Format: JPG, PNG (Max 5MB per image)</li>
          <li>Minimum resolution: 800x600 pixels recommended</li>
          <li>Clear, well-lit photos in good condition</li>
          <li>Take photos in natural daylight when possible</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageGuide;
