import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '../api/catalogApi.js';
import { usePincode } from '../../../providers/PincodeProvider.jsx';

// The page address keeps a 0-based page; the API takes a 1-based page and a limit.
function toApiParams({ page = 0, brandId, ...rest }, pincode) {
  const query = { ...rest, pincode: rest.pincode || pincode };
  if (page > 0) query.page = page + 1;
  if (brandId) query.brand = brandId;
  Object.keys(query).forEach((key) => query[key] === '' && delete query[key]);
  return query;
}

export function useBooks(params = {}) {
  const { pincode } = usePincode();
  const queryParams = toApiParams(params, pincode);

  return useQuery({
    queryKey: ['books', queryParams],
    queryFn: () => catalogApi.getBooks(queryParams),
    staleTime: 1000 * 60 * 2
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: catalogApi.getCategories,
    staleTime: 1000 * 60 * 10
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: catalogApi.getRecommendations,
    staleTime: 1000 * 60 * 3
  });
}

export function useBestsellers(limit = 6) {
  const { pincode } = usePincode();
  return useQuery({
    queryKey: ['bestsellers', { limit, pincode }],
    queryFn: () => catalogApi.getBooks({ sort: 'bestselling', limit, pincode }),
    staleTime: 1000 * 60 * 3
  });
}

export function useNewLaunches(limit = 6) {
  const { pincode } = usePincode();
  return useQuery({
    queryKey: ['newLaunches', { limit, pincode }],
    queryFn: () => catalogApi.getBooks({ sort: 'newest', limit, pincode }),
    staleTime: 1000 * 60 * 3
  });
}

export function useBook(id) {
  const { pincode } = usePincode();
  return useQuery({
    queryKey: ['book', id, pincode],
    queryFn: () => catalogApi.getBook(id, pincode),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2
  });
}

export function useRelated(id) {
  return useQuery({
    queryKey: ['relatedBooks', id],
    queryFn: () => catalogApi.getRelatedBooks(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5
  });
}

export function useNotifyMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookId) => catalogApi.notifyMe(bookId),
    onSuccess: (_, bookId) => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    }
  });
}

export function useDeliveryEstimate(pincode) {
  return useQuery({
    queryKey: ['deliveryEstimate', pincode],
    queryFn: () => catalogApi.estimateDelivery(pincode),
    enabled: Boolean(pincode && /^[1-9][0-9]{5}$/.test(String(pincode).trim())),
    staleTime: 1000 * 60 * 5
  });
}
