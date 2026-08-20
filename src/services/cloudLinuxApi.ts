import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase';

export interface CloudLinuxLicensePayload {
  ip: string;
  type: number; // For example: 1 = CloudLinux OS, 17 = Imunify360
}

/**
 * Add an IP License to CloudLinux Network
 */
export const addCloudLinuxLicense = async (payload: CloudLinuxLicensePayload): Promise<any> => {
  try {
    const functions = getFunctions(auth.app);
    const clnProxy = httpsCallable(functions, 'cloudLinuxProxy');
    
    const result = await clnProxy({
      method: 'POST',
      endpoint: '/v2/ip-license/licenses',
      payload
    });

    return result.data;
  } catch (error: any) {
    console.error('CloudLinux API Error (Add):', error);
    throw new Error(error.message || 'Failed to add CloudLinux license.');
  }
};

/**
 * Remove an IP License from CloudLinux Network
 */
export const removeCloudLinuxLicense = async (ip: string, type: number): Promise<any> => {
  try {
    const functions = getFunctions(auth.app);
    const clnProxy = httpsCallable(functions, 'cloudLinuxProxy');
    
    // According to CLN v2, DELETE requests might require query params or specific endpoints.
    // Assuming /v2/ip-license/licenses?ip=IP&type=TYPE based on REST patterns.
    const result = await clnProxy({
      method: 'DELETE',
      endpoint: \`/v2/ip-license/licenses?ip=\${ip}&type=\${type}\`,
    });

    return result.data;
  } catch (error: any) {
    console.error('CloudLinux API Error (Remove):', error);
    throw new Error(error.message || 'Failed to remove CloudLinux license.');
  }
};
