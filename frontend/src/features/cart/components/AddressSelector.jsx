import React, { useState, useEffect } from 'react';
import { useAddresses, useCreateAddress } from '../../profile/hooks/useAddresses.js';
import { Button, Card, Badge, Modal, Spinner } from '../../../components/ui/index.js';
import { AddressForm } from '../../../components/AddressForm.jsx';
import { Plus, MapPin, Check } from 'lucide-react';

export function AddressSelector({ selectedAddressId, onSelectAddress }) {
  const { data: addresses = [], isLoading } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-select default address on load if none selected
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        onSelectAddress(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId, onSelectAddress]);

  const handleCreateAddress = async (formData) => {
    try {
      const newAddr = await createAddressMutation.mutateAsync(formData);
      setIsModalOpen(false);
      if (newAddr?.id) {
        onSelectAddress(newAddr.id);
      }
    } catch {
      // error handled by form/query
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-surface border border-border rounded-xl">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
          Delivery Address
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-4 text-center border-dashed">
          <p className="text-sm text-muted mb-3">No delivery address saved yet.</p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            Add New Address
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Select delivery address">
          {addresses.map((address) => {
            const isSelected = selectedAddressId === address.id;
            return (
              <div
                key={address.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onSelectAddress(address.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onSelectAddress(address.id);
                  }
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border bg-surface hover:border-text/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-text">{address.recipientName}</span>
                    <Badge variant="secondary" size="sm">
                      {address.label}
                    </Badge>
                  </div>
                  {address.isDefault && (
                    <Badge variant="primary" size="sm">
                      Default
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} - {address.postalCode}
                </p>
                <p className="text-xs text-muted mt-1 font-medium">Phone: {address.phone}</p>

                <div className="flex items-center gap-1.5 text-xs font-medium mt-2 pt-2 border-t border-border/50 text-primary">
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Deliver to this address</span>
                    </>
                  ) : (
                    <span>Click to deliver here</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Delivery Address"
      >
        <AddressForm
          onSubmit={handleCreateAddress}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createAddressMutation.isPending}
          submitText="Add Address"
        />
      </Modal>
    </div>
  );
}
export default AddressSelector;
