/**
 * Builds the API client for a record type. Income, expenses and upcoming
 * income all expose the same REST endpoints (see server createRecordRouter.js).
 */
import { api } from './api';

export function createRecordService(resourcePath) {
  return {
    listByMonth: (month) => api.get(resourcePath, { month }),
    getById: (id) => api.get(`${resourcePath}/${id}`),
    create: (record) => api.post(resourcePath, record),
    update: (id, record) => api.put(`${resourcePath}/${id}`, record),
    changeStatus: (id, status) => api.patch(`${resourcePath}/${id}/status`, { status }),
    remove: (id) => api.delete(`${resourcePath}/${id}`),
    bulkChangeStatus: (ids, status) => api.post(`${resourcePath}/bulk-status`, { ids, status }),
    bulkRemove: (ids) => api.post(`${resourcePath}/bulk-delete`, { ids }),
  };
}
