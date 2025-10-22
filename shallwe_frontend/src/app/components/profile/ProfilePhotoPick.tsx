import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'

import Cropper, { Area, Point } from 'react-easy-crop' // Import Cropper and required types, remove Size if not needed elsewhere

import { ApiError } from '@/lib/shallwe/common/api/calls' // Import ApiError type
import { performFacecheck } from '@/lib/shallwe/photo/api/calls' // Import the facecheck API call
import { validateProfilePhotoFile } from '@/lib/shallwe/photo/formstates/validators' // Import THE specific validator
import PhotoWithFallbacks from './PhotoWithFallbacks'


type Crop = Point // Type alias for {x, y} point
type Zoom = number


interface ProfilePhotoPickProps {
  initialFile?: File | null
  initialPhotoUrl?: string | null
  onError: (error: string) => void
  onClearError: () => void
  onCropComplete: (croppedFile: File) => void
}


const ProfilePhotoPick: React.FC<ProfilePhotoPickProps> = ({ 
  initialFile, 
  initialPhotoUrl,
  onError, 
  onClearError, 
  onCropComplete,
}) => {
  
  const [imageSrc, setImageSrc] = useState<string | null>(null); // Source for the image to crop (from new file)
  const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(null); // URL for displaying existing photo
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<Zoom>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [finalCroppedFile, setFinalCroppedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // --- EFFECT 1: Handle changes to initialFile (new file selected) ---
  // This effect prioritizes a newly selected file for cropping/preview
  useEffect(() => {
    if (initialFile instanceof File) {
      console.log("ProfilePhoto: New initialFile provided, preparing for cropping.");
      // A new file is provided (e.g., from parent state after user selection)
      setSelectedRawFile(initialFile);
      setFinalCroppedFile(null); // Clear any previous final cropped file
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string); // Set imageSrc to trigger cropper UI
        setDisplayImageUrl(null); // Ensure display URL is cleared if showing cropper
        // Reset crop/zoom for new image
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.onerror = () => {
        console.error("ProfilePhoto: Error reading initialFile.");
        onError("Failed to load the selected image.");
        setImageSrc(null);
        setDisplayImageUrl(null);
      };
      reader.readAsDataURL(initialFile);
    } else if (initialFile === null) {
      // Explicitly cleared by parent (e.g., onClear or successful save leading to reset)
      console.log("ProfilePhoto: initialFile cleared.");
      handleClearInternals(); // Reset internal state
    }
    // Note: Does not handle initialFile being a string URL here, that's initialPhotoUrl's job.
  }, [initialFile]); // Only re-run if initialFile prop changes

  // --- EFFECT 2: Handle changes to initialPhotoUrl (existing photo URL) ---
  // This effect sets the display URL when no new file is being processed.
  useEffect(() => {
    if (initialPhotoUrl && typeof initialPhotoUrl === 'string') {
      // An initial photo URL is provided (e.g., existing profile photo)
      console.log("ProfilePhoto: initialPhotoUrl provided.");
      // Only set display URL if there's no new file selected/cropped currently
      if (!selectedRawFile && !finalCroppedFile && !imageSrc) {
        setDisplayImageUrl(initialPhotoUrl);
      }
      // If a new file is selected (imageSrc/finalCroppedFile set), this URL is ignored visually.
    } else if (initialPhotoUrl === null || initialPhotoUrl === '') {
      // URL explicitly cleared or invalid
      console.log("ProfilePhoto: initialPhotoUrl cleared or invalid.");
      // Only clear display URL if no new file is actively being processed
      if (!selectedRawFile && !finalCroppedFile && !imageSrc) {
        setDisplayImageUrl(null);
      }
    }
  }, [initialPhotoUrl, selectedRawFile, finalCroppedFile, imageSrc]); // Re-run if URL or processing state changes

  // --- HELPER: Clear internal state without triggering prop changes ---
  const handleClearInternals = () => {
    setImageSrc(null);
    setDisplayImageUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setSelectedRawFile(null);
    setFinalCroppedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset native file input
    }
    // Do NOT call onClearError here automatically, let parent decide.
    };

  // Clear state when initialFile changes (e.g., cleared by parent)
  useEffect(() => {
     if (initialFile === null) {
         handleClear()
     }
  }, [initialFile])

  // Handle file selection
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      // Clear previous error and state when a new file is selected
      onClearError()
      setSelectedRawFile(file)
      setFinalCroppedFile(null) // Clear final file as we are starting over
      setImageSrc(null) // Clear preview initially

      // --- RUN THE SPECIFIC VALIDATOR FOR THE RAW FILE ---
      // Pass the raw file directly to the dedicated validator
      const fieldError = validateProfilePhotoFile(file) // Call the specific validator

      if (fieldError) {
          // Validator failed for the raw file
          onError(fieldError)
          setSelectedRawFile(null) // Reset the internal state
          // Do not proceed to load the image
          return
      }

      // Validator passed for the raw file, proceed to load preview
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
        // Reset crop position when a new image is loaded
        setCrop({ x: 0, y: 0 })
        setZoom(1) // Reset zoom when a new image is loaded
        // Clear any previous errors related to the photo now that a valid raw file is selected
        onClearError()
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle crop change (position) - This function is passed to the Cropper component
  const onCropChange = (newCrop: Crop) => {
    setCrop(newCrop)
  }

  // Handle zoom change - This function is passed to the Cropper component
  const onZoomChange = (newZoom: Zoom) => {
    setZoom(newZoom)
  }

  // Handle area selection change (when user moves/zooms the crop area) - This function is passed to the Cropper component
  const onCropCompleteHandler = useCallback((croppedArea: Area, newCroppedAreaPixels: Area) => {
    // setCroppedAreaPixels is called with the new pixels
    setCroppedAreaPixels(newCroppedAreaPixels)
  }, []) // No dependencies needed for this callback if setCroppedAreaPixels is stable


  // Crop the image using canvas
  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) {
      console.error("Cannot crop: imageSrc or croppedAreaPixels is missing")
      return null
    }

    const image = new Image()
    image.src = imageSrc
    await new Promise((resolve) => {
      image.onload = resolve
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.error('Canvas context not available')
      return null
    }

    // Set canvas size to the cropped area size
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height

    // Draw the cropped portion of the image onto the canvas
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    )

    return new Promise((resolve) => {
      canvas.toBlob(resolve, selectedRawFile?.type || 'image/jpeg') // Use original file type if possible
    })
  }, [imageSrc, croppedAreaPixels, selectedRawFile?.type])

  const finalCroppedFileUrl = useMemo(() => {
    console.log("ProfilePhoto: Recalculating finalCroppedFileUrl");
    return finalCroppedFile ? URL.createObjectURL(finalCroppedFile) : null;
  }, [finalCroppedFile]); // Only recalculate if finalCroppedFile object reference changes

  // Handle Apply button click
  const handleApply = async () => {
    if (!selectedRawFile || !croppedAreaPixels) {
      onError('No image selected or crop area defined.')
      return
    }

    setIsLoading(true)
    try {
      // Get the cropped image blob
      const croppedBlob = await getCroppedImg()
      if (!croppedBlob) {
        throw new Error('Failed to crop image.')
      }

      // Convert blob to file - this is the final file that will be validated and sent
      const croppedFile = new File([croppedBlob], selectedRawFile.name, { type: selectedRawFile.type })

      // Perform facecheck API call with the cropped file
      const facecheckResult = await performFacecheck(croppedFile)

      // Check the result of the facecheck API call
      if (facecheckResult.success) {
        // Facecheck passed, set the final file state
        setFinalCroppedFile(croppedFile)
        // Pass the final cropped file back to the parent
        onCropComplete(croppedFile)
        // Clear any previous errors related to the photo now that facecheck passed
        onClearError()
      } else {
        // Facecheck failed (e.g., no face detected), show API error
        // The API spec might return a different structure, adjust based on actual response
        // Assuming facecheckResult.error exists if success is false
        onError(facecheckResult.error || 'Facecheck failed. Please ensure your photo contains a clear face.')
        setFinalCroppedFile(null) // Clear the final file state as it's invalid
      }
    } catch (error) {
      console.error('Error during facecheck:', error)
      // Handle API errors (e.g., network issues, 400 bad request from facecheck)
      let errorMessage = 'An error occurred during photo validation.'
      if (error && typeof error === 'object' && 'details' in error) {
          const apiError = error as ApiError
          if (apiError.details && typeof apiError.details === 'object' && 'error' in apiError.details) {
              const apiErrorMsg = apiError.details.error
              errorMessage = typeof apiErrorMsg === 'string' ? apiErrorMsg : JSON.stringify(apiErrorMsg)
          } else if (apiError.message) {
              errorMessage = apiError.message
          }
      } else if (error instanceof Error) {
          errorMessage = error.message
      }
      onError(errorMessage)
      setFinalCroppedFile(null) // Clear the final file state as it's invalid
    } finally {
      setIsLoading(false)
    }
  }

  // Clear the current image and reset state
  const handleClear = () => {
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setSelectedRawFile(null)
    setFinalCroppedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // Reset file input
    }
    onClearError() // Clear any errors associated with the previous image
  }

  // Load initial file preview if provided (only if it passes initial validation conceptually,
  // but we don't re-validate here unless initialFile changes)
  useEffect(() => {
    if (initialFile) {
      // Assume initialFile passed validation when it was set in the parent state
      // Just load the preview for the initial file
      setSelectedRawFile(initialFile)
      setFinalCroppedFile(initialFile) // If initialFile is the *final* cropped one from a previous save/edit
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
      }
      reader.readAsDataURL(initialFile)
    } else {
      // If initialFile is null/undefined, clear the state
      handleClear()
    }
  }, [initialFile]) // Only run on initialFile change, not on other state changes


  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Photo (JPG, PNG, HEIC, HEIF, max 20MB, will be cropped to square)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
          onChange={onFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {/* Preview Area - Shows raw file preview, cropped preview, or placeholder */}
      <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded-md overflow-hidden border border-gray-300">
        {imageSrc && !finalCroppedFile && ( // Show cropper if new raw file is loaded but not yet validated/applied
          <>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteHandler} // Make sure this handler updates croppedAreaPixels
              showGrid={true}
            />
          </>
        )}
        {finalCroppedFile && ( // Show final cropped file preview if available (after successful apply)
          <PhotoWithFallbacks
            src={finalCroppedFileUrl!}
            alt="Cropped preview"
            className="w-full h-full object-contain"
          />
        )}
        {!imageSrc && !finalCroppedFile && displayImageUrl && ( // Show existing photo URL if available and no new file is being processed
          <PhotoWithFallbacks
            src={displayImageUrl}
            alt="Existing profile photo"
            className="w-full h-full object-contain" // Pass Tailwind classes
          />
        )}
        {!imageSrc && !finalCroppedFile && !displayImageUrl && ( // Show placeholder if nothing to display
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400 text-sm">Select a photo to begin</p>
          </div>
        )}
      </div>

      {/* Controls appear after raw file is loaded and validated */}
      {imageSrc && !finalCroppedFile && ( // Show controls if raw file is loaded but not yet cropped/validated
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <label htmlFor="zoom" className="text-sm font-medium text-gray-700">
              Zoom:
            </label>
            <input
              id="zoom"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="w-full max-w-xs"
            />
            <span className="text-sm text-gray-500">{zoom.toFixed(2)}x</span>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading}
              className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? 'Validating...' : 'Apply & Validate'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Show final cropped file name after successful cropping/validation */}
      {finalCroppedFile && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">Selected: {finalCroppedFile.name}</p>
        </div>
      )}
    </div>
  )
}

export default ProfilePhotoPick
