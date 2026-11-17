import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema } from '../lib/schemas.js';
import { Input, Select, Button } from './ui/index.js';

export function AddressForm({
  initialValues = null,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = 'Save Address'
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: initialValues?.label || 'HOME',
      recipientName: initialValues?.recipientName || '',
      phone: initialValues?.phone || '',
      line1: initialValues?.line1 || '',
      line2: initialValues?.line2 || '',
      city: initialValues?.city || '',
      state: initialValues?.state || '',
      postalCode: initialValues?.postalCode || '',
      country: initialValues?.country || 'India',
      isDefault: initialValues?.isDefault ?? false
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Address Label"
          required
          error={errors.label?.message}
          {...register('label')}
        >
          <option value="HOME">Home</option>
          <option value="OFFICE">Office</option>
          <option value="OTHER">Other</option>
        </Select>

        <Input
          label="Recipient Name"
          placeholder="e.g. John Doe"
          required
          error={errors.recipientName?.message}
          {...register('recipientName')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone Number (10 digits)"
          placeholder="9876543210"
          type="tel"
          maxLength={10}
          required
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="PIN Code (6 digits)"
          placeholder="110001"
          maxLength={6}
          required
          error={errors.postalCode?.message}
          {...register('postalCode')}
        />
      </div>

      <Input
        label="Address Line 1"
        placeholder="House/Flat No., Building Name, Street"
        required
        error={errors.line1?.message}
        {...register('line1')}
      />

      <Input
        label="Address Line 2 (Optional)"
        placeholder="Landmark, Area, Colony"
        error={errors.line2?.message}
        {...register('line2')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="City"
          placeholder="New Delhi"
          required
          error={errors.city?.message}
          {...register('city')}
        />

        <Input
          label="State"
          placeholder="Delhi"
          required
          error={errors.state?.message}
          {...register('state')}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isDefaultAddressCheckbox"
          className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-bg"
          {...register('isDefault')}
        />
        <label htmlFor="isDefaultAddressCheckbox" className="text-sm font-medium text-text cursor-pointer">
          Make this my default delivery address
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {submitText}
        </Button>
      </div>
    </form>
  );
}
export default AddressForm;
