import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListingToken, formatCurrency, updateListing } from "@/lib/listings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Listing, Item } from "@/types/listing";

export default function ListingView() {
  const { id = "0" } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Extract the editToken from the URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const editTokenParam = searchParams.get("edit");
  
  // Get the stored token for this listing
  const storedToken = getListingToken(parseInt(id, 10));
  
  // Check if edit mode is allowed
  const canEdit = editTokenParam && (editTokenParam === storedToken);
  
  // State for editable fields
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    items: [{ name: "", price: 0 }],
    pickupInstructions: "",
    paymentInfo: "",
    imageUrl: ""
  });
  
  // Fetch the listing data
  const { data: listing = {
    id: parseInt(id, 10),
    title: "",
    description: "",
    items: [],
    pickupInstructions: "",
    paymentInfo: "",
    imageUrl: "",
    createdAt: new Date(),
    editToken: ""
  } as Listing, isLoading, error } = useQuery<Listing>({
    queryKey: [`/api/listings/${id}`],
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updates: typeof editForm) => {
      if (!canEdit || !storedToken) throw new Error("Not authorized to edit");
      return updateListing(parseInt(id, 10), storedToken, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${id}`] });
      setIsEditMode(false);
      toast({
        title: "Listing updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Initialize edit form when listing data loads
  useEffect(() => {
    if (listing) {
      setEditForm({
        title: listing.title,
        description: listing.description || "",
        items: listing.items,
        pickupInstructions: listing.pickupInstructions,
        paymentInfo: listing.paymentInfo || "",
        imageUrl: listing.imageUrl || ""
      });
    }
  }, [listing]);
  
  // Check if we should enter edit mode from URL param
  useEffect(() => {
    if (canEdit && listing) {
      setIsEditMode(true);
    }
  }, [canEdit, listing]);
  
  // Handle edit form changes
  const handleFormChange = (field: string, value: string | any[]) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle item changes in edit mode
  const handleItemChange = (index: number, field: 'name' | 'price', value: string | number) => {
    const newItems = [...editForm.items];
    newItems[index] = { 
      ...newItems[index], 
      [field]: field === 'price' ? parseFloat(value as string) || 0 : value 
    };
    handleFormChange('items', newItems);
  };
  
  // Add new item in edit mode
  const addItem = () => {
    handleFormChange('items', [...editForm.items, { name: "", price: 0 }]);
  };
  
  // Remove item in edit mode
  const removeItem = (index: number) => {
    const newItems = editForm.items.filter((_, i) => i !== index);
    handleFormChange('items', newItems);
  };
  
  // Save changes
  const saveChanges = () => {
    updateMutation.mutate(editForm);
  };
  
  // Cancel edit mode
  const cancelEdit = () => {
    if (listing) {
      setEditForm({
        title: listing.title,
        description: listing.description || "",
        items: listing.items,
        pickupInstructions: listing.pickupInstructions,
        paymentInfo: listing.paymentInfo || "",
        imageUrl: listing.imageUrl || ""
      });
    }
    setIsEditMode(false);
    
    // Remove the edit parameter from URL
    window.history.replaceState({}, document.title, `/l/${id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 pb-16 w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-lg mx-auto px-4 pb-16 w-full text-center">
        <h2 className="text-xl font-medium text-neutral-800 mb-4">Listing not found</h2>
        <p className="text-neutral-600 mb-4">
          The listing you're looking for might have been removed or is no longer available.
        </p>
        <Button onClick={() => navigate("/")} className="py-4 px-6">
          Go back home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-16 w-full">
      {isEditMode && (
        <div className="bg-primary text-primary-foreground text-center py-2 px-4 mb-4 rounded-md shadow-sm">
          <p className="text-sm">Edit mode enabled. Make changes and save when done.</p>
        </div>
      )}
      
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-800 -ml-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>
      
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {/* Listing Image (if available) */}
          {listing.imageUrl && (
            <div className="mb-6 -mx-4 sm:-mx-6 sm:-mt-6">
              <img 
                src={listing.imageUrl} 
                alt={listing.title} 
                className="w-full h-48 sm:h-64 object-cover"
              />
            </div>
          )}
          
          {/* Listing Header */}
          <div className="mb-6">
            {isEditMode ? (
              <>
                <Label htmlFor="edit-title" className="text-sm font-medium mb-1 block">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="mb-2"
                />
                
                <Label htmlFor="edit-description" className="text-sm font-medium mb-1 block">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="resize-none min-h-[100px]"
                />
              </>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-medium text-neutral-800 mb-2">{listing.title}</h2>
                {listing.description && <p className="text-neutral-600">{listing.description}</p>}
              </>
            )}
          </div>
          
          {/* Item List */}
          <div className="mb-6">
            <h3 className="font-medium text-neutral-700 mb-3">Available items</h3>
            
            {isEditMode ? (
              <div className="space-y-3 mb-3">
                {editForm.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center pb-2 border-b border-neutral-100">
                    <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="Item name"
                      className="flex-grow"
                    />
                    <div className="flex items-center w-full sm:w-24">
                      <span className="text-neutral-500 mr-1">$</span>
                      <Input
                        type="number"
                        value={item.price === 0 ? "" : item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 ml-auto"
                      disabled={editForm.items.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addItem}
                  size="sm"
                  className="mt-3"
                >
                  + Add item
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-md">
                {listing.items.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between py-3 ${
                      index !== listing.items.length - 1 ? "border-b border-neutral-200" : ""
                    }`}
                  >
                    <span className="text-neutral-800">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pickup Instructions */}
          <div className="mb-6">
            <h3 className="font-medium text-neutral-700 mb-2">Pickup details</h3>
            
            {isEditMode ? (
              <Textarea
                value={editForm.pickupInstructions}
                onChange={(e) => handleFormChange('pickupInstructions', e.target.value)}
                className="resize-none min-h-[100px]"
              />
            ) : (
              <div className="bg-neutral-50 rounded-md p-3">
                <p className="text-neutral-700 whitespace-pre-wrap">{listing.pickupInstructions}</p>
              </div>
            )}
          </div>
          
          {/* Payment Info */}
          {(listing.paymentInfo || isEditMode) && (
            <div>
              <h3 className="font-medium text-neutral-700 mb-2">Payment</h3>
              
              {isEditMode ? (
                <Textarea
                  value={editForm.paymentInfo}
                  onChange={(e) => handleFormChange('paymentInfo', e.target.value)}
                  className="resize-none min-h-[80px]"
                  placeholder="e.g., Cash or e-transfer to..."
                />
              ) : (
                <p className="text-neutral-600 whitespace-pre-wrap">{listing.paymentInfo}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="space-y-3">
          <Button 
            onClick={saveChanges}
            className="w-full py-5"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button 
            variant="outline" 
            onClick={cancelEdit}
            className="w-full py-5"
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      )}
      
      {/* Listing Footer */}
      <div className="text-center text-sm text-neutral-500 mt-6">
        <p>Created with <a href="/" className="text-primary hover:text-primary/90">Small Things</a></p>
      </div>
    </div>
  );
}
