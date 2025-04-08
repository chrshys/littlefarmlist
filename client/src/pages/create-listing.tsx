import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trash2, MapPin, Image, X, Tag } from "lucide-react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { CreateListingForm, Item } from "@/types/listing";
import { createListing, getRandomNiagaraAddress, niagaraAddresses, imageToBase64 } from "@/lib/listings";
import { Badge } from "@/components/ui/badge";

// Validation schema based on our shared schema
const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  price: z.number().min(0, "Price must be a positive number"),
});

const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

const createListingSchema = z.object({
  address: z.string().min(5, "Address is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  categories: z.array(z.string()).optional(),
  pickupInstructions: z.string().min(5, "Pickup instructions are required"),
  paymentInfo: z.string().optional(),
  coordinates: coordinatesSchema.optional(),
  imageUrl: z.string().optional(),
});

export default function CreateListing() {
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [addressSuggestion, setAddressSuggestion] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Available categories
  const categories = [
    "Vegetables", 
    "Fruits", 
    "Dairy", 
    "Eggs", 
    "Meat", 
    "Honey", 
    "Baked Goods", 
    "Preserves", 
    "Plants",
    "Herbs",
    "Flowers"
  ];

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateListingForm>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: "",
      description: "",
      items: [{ name: "", price: 0 }],
      pickupInstructions: "",
      paymentInfo: "",
      address: "",
    }
  });

  // Item field array setup
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  
  // Function to suggest a random Niagara region address
  const suggestNiagaraAddress = () => {
    const { address, coordinates } = getRandomNiagaraAddress();
    // Set the suggestion in state so we can match it when submitting
    setAddressSuggestion(address);
    
    // Update the form with the address and coordinates
    const addressField = document.getElementById('address') as HTMLInputElement;
    if (addressField) {
      addressField.value = address;
      // Trigger an input event to ensure react-hook-form updates
      const event = new Event('input', { bubbles: true });
      addressField.dispatchEvent(event);
    }
  };
  
  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64Image = await imageToBase64(file);
        setPreviewImage(base64Image);
        
        // Set the base64 string to the hidden input for form submission
        const imageUrlField = document.getElementById('imageUrl') as HTMLInputElement;
        if (imageUrlField) {
          imageUrlField.value = base64Image;
          // Trigger an input event to ensure react-hook-form updates
          const event = new Event('input', { bubbles: true });
          imageUrlField.dispatchEvent(event);
        }
      } catch (error) {
        console.error('Error converting image to base64:', error);
        toast({
          title: "Image upload failed",
          description: "Unable to process the selected image",
          variant: "destructive"
        });
      }
    }
  };
  
  // Handle removing the uploaded image
  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear the hidden input
    const imageUrlField = document.getElementById('imageUrl') as HTMLInputElement;
    if (imageUrlField) {
      imageUrlField.value = '';
      // Trigger an input event to ensure react-hook-form updates
      const event = new Event('input', { bubbles: true });
      imageUrlField.dispatchEvent(event);
    }
  };
  
  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category) // Remove if already selected
        : [...prev, category]; // Add if not selected
        
      // Update hidden input for form submission
      const categoriesField = document.getElementById('categories') as HTMLInputElement;
      if (categoriesField) {
        categoriesField.value = JSON.stringify(newCategories);
        // Trigger an input event to ensure react-hook-form updates
        const event = new Event('input', { bubbles: true });
        categoriesField.dispatchEvent(event);
      }
      
      return newCategories;
    });
  };

  const onSubmit = async (data: CreateListingForm) => {
    setIsSubmitting(true);
    try {
      // Add coordinates if we have an address suggestion from Niagara region
      if (addressSuggestion && data.address === addressSuggestion) {
        // Find the matching address in our Niagara addresses array
        const matchingAddress = niagaraAddresses.find(item => item.address === addressSuggestion);
        if (matchingAddress) {
          // Add the coordinates to the form data
          data.coordinates = matchingAddress.coordinates;
        }
      } else if (data.address) {
        // If user entered a different address but it contains "Niagara", try to find a close match
        const lowerAddress = data.address.toLowerCase();
        if (lowerAddress.includes('niagara')) {
          // Use a default Niagara region coordinate as fallback
          data.coordinates = { lat: 43.0582, lng: -79.2902 }; // Niagara region center
        }
      }
      
      // Add the selected categories
      if (selectedCategories.length > 0) {
        data.categories = selectedCategories;
      }
      
      const listing = await createListing(data);
      navigate(`/confirmation/${listing.id}`);
    } catch (error) {
      console.error("Failed to create listing", error);
      toast({
        title: "Failed to create listing",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-16">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 text-neutral-600 hover:text-neutral-800"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-medium text-neutral-800">Create a listing</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Location/Address */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="address" className="text-sm font-medium text-neutral-700 flex items-center">
              Farm Address <MapPin className="h-4 w-4 ml-1 text-primary-500" />
            </Label>
            <Button
              type="button"
              variant="link"
              className="text-sm text-primary-500 hover:text-primary-600 font-medium p-0 h-auto"
              onClick={suggestNiagaraAddress}
            >
              Suggest Niagara address
            </Button>
          </div>
          <Input
            id="address"
            placeholder="e.g., 123 Niagara Stone Road, Niagara-on-the-Lake, ON"
            {...register("address")}
            className={errors.address ? "border-red-300" : ""}
          />
          {errors.address && (
            <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            This address will be shown on the map to help buyers find your farm
          </p>
        </div>

        {/* Listing Title */}
        <div>
          <Label htmlFor="title" className="text-sm font-medium text-neutral-700 mb-2 block">
            Title
          </Label>
          <Input
            id="title"
            placeholder="e.g., Fresh eggs today"
            {...register("title")}
            className={errors.title ? "border-red-300" : ""}
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>
        
        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-sm font-medium text-neutral-700 mb-2 block">
            Description (optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Share details about what you're offering"
            className="resize-none"
            {...register("description")}
          />
        </div>
        
        {/* Items for Sale */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm font-medium text-neutral-700">
              Items for sale
            </Label>
            <Button
              type="button"
              variant="link"
              className="text-sm text-primary-500 hover:text-primary-600 font-medium p-0 h-auto"
              onClick={() => append({ name: "", price: 0 })}
            >
              + Add item
            </Button>
          </div>
          
          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-3">
                <div className="flex space-x-3">
                  <div className="flex-grow">
                    <Input
                      placeholder="Item name"
                      className="mb-2"
                      {...register(`items.${index}.name` as const)}
                    />
                    <div className="flex items-center">
                      <span className="text-neutral-500 mr-2">$</span>
                      <Controller
                        control={control}
                        name={`items.${index}.price` as const}
                        render={({ field }) => (
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                            value={field.value === 0 ? "" : field.value}
                          />
                        )}
                      />
                    </div>
                    {errors.items?.[index]?.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.items[index]?.name?.message}
                      </p>
                    )}
                    {errors.items?.[index]?.price && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.items[index]?.price?.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                    className="self-center text-neutral-400 hover:text-neutral-600 h-8 w-8"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          {errors.items && !Array.isArray(errors.items) && (
            <p className="text-sm text-red-500 mt-1">{errors.items.message}</p>
          )}
        </div>
        
        {/* Pickup Instructions */}
        <div>
          <Label htmlFor="pickupInstructions" className="text-sm font-medium text-neutral-700 mb-2 block">
            Pickup instructions
          </Label>
          <Textarea
            id="pickupInstructions"
            placeholder="e.g., Available at the end of my driveway from 2-6pm"
            className="resize-none"
            {...register("pickupInstructions")}
          />
          {errors.pickupInstructions && (
            <p className="text-sm text-red-500 mt-1">{errors.pickupInstructions.message}</p>
          )}
        </div>
        
        {/* Payment Info */}
        <div>
          <Label htmlFor="paymentInfo" className="text-sm font-medium text-neutral-700 mb-2 block">
            Payment info (optional)
          </Label>
          <Textarea
            id="paymentInfo"
            placeholder="e.g., Cash or e-transfer to..."
            className="resize-none"
            {...register("paymentInfo")}
          />
        </div>
        
        {/* Image Upload */}
        <div>
          <Label htmlFor="image" className="text-sm font-medium text-neutral-700 mb-2 block">
            Add an image (optional)
          </Label>
          
          {/* Hidden input for the base64 image data */}
          <input 
            type="hidden" 
            id="imageUrl" 
            {...register("imageUrl")} 
          />
          
          {previewImage ? (
            <div className="relative mt-2 rounded-md overflow-hidden">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-44 object-cover" 
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="mt-2">
              <div 
                className="border-2 border-dashed border-neutral-200 rounded-md p-6 text-center hover:border-primary-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="mx-auto h-12 w-12 text-neutral-400" />
                <div className="mt-2">
                  <p className="text-sm font-medium text-primary-600">Click to add an image</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Add a photo of your farm or products to attract more customers
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create listing"}
        </Button>
      </form>
    </div>
  );
}
