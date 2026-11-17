import { useState } from 'react';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress
} from '../hooks/useAddresses';
import { getFieldErrors, getErrorMessage } from '../../../lib/errors';
import AddressForm from '../../../components/AddressForm';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';

export default function AddressList() {
  const { data: addresses = [], isLoading } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formError, setFormError] = useState(null);

  const closeForm = () => {
    setShowForm(false);
    setEditingAddress(null);
    setFormError(null);
  };

  const handleSubmit = async (formData) => {
    setFormError(null);
    try {
      if (editingAddress) {
        await updateAddressMutation.mutateAsync({ id: editingAddress.id, data: formData });
      } else {
        await createAddressMutation.mutateAsync(formData);
      }
      closeForm();
    } catch (err) {
      const fieldErrors = Object.values(getFieldErrors(err));
      setFormError(fieldErrors.length > 0 ? fieldErrors.join(' ') : getErrorMessage(err));
    }
  };

  const handleSetDefault = (address) => {
    updateAddressMutation.mutate({
      id: address.id,
      data: {
        label: address.label,
        recipientName: address.recipientName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 || '',
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || 'India',
        isDefault: true
      }
    });
  };

  const handleDelete = (id) => {
    deleteAddressMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text">Saved Addresses</h2>
          <p className="text-xs text-muted mt-0.5">
            Manage your delivery destinations and default address.
          </p>
        </div>
        {!showForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingAddress(null);
              setShowForm(true);
            }}
          >
            + Add Address
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-6 border-primary/40 bg-surface">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
          </div>
          {formError && (
            <div className="mb-4 p-3 rounded bg-danger/10 text-danger text-xs">
              {formError}
            </div>
          )}
          <AddressForm
            key={editingAddress?.id || 'new'}
            initialValues={editingAddress}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            isLoading={createAddressMutation.isPending || updateAddressMutation.isPending}
            submitText={editingAddress ? 'Save Changes' : 'Add Address'}
          />
        </Card>
      )}

      {isLoading ? (
        <p className="text-xs text-muted">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-muted py-4">
          No saved addresses. Add a delivery address to use during checkout.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card
              key={addr.id}
              className={`p-4 flex flex-col justify-between space-y-3 ${
                addr.isDefault ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text">
                    {addr.recipientName}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={addr.isDefault ? 'primary' : 'default'} size="sm">
                      {addr.label}
                    </Badge>
                    {addr.isDefault && (
                      <Badge variant="success" size="sm">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {addr.line1}
                  {addr.line2 && `, ${addr.line2}`}
                  <br />
                  {addr.city}, {addr.state} - {addr.postalCode}
                  <br />
                  Phone: {addr.phone}
                </p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                {!addr.isDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(addr)}
                    loading={updateAddressMutation.isPending}
                  >
                    Set as Default
                  </Button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAddress(addr);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(addr.id)}
                    loading={deleteAddressMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
