/**
 * Admin API Service - Complete Real-World Version
 * Comprehensive mock data for FloodAid Management System
 * TODO: Replace all mock implementations with actual backend API calls
 */

// ============================================================================
// MOCK DATA - Realistic Pakistan Flood Relief Scenario
// ============================================================================

// Dashboard Statistics
const mockStats = {
  totalUsers: 3847,
  activeAidRequests: 156,
  pendingAidRequests: 89,
  completedAidRequests: 1247,
  totalShelters: 42,
  totalInventoryItems: 2456,
  shelterOccupancy: 73,
  criticalRequests: 23,
  totalDonations: 4250000,
  monthlyDonations: 850000,
  activeVolunteers: 234,
  distributedAid: 1847,
  affectedFamilies: 8920,
  rescuedPeople: 12450,
  medicalCasesHandled: 3560,
  mealsServed: 156000
};

// Users with realistic Pakistani names and details
const mockUsers = [
  { id: 1, name: 'Muhammad Ali Khan', email: 'ali.khan@example.com', phone: '+92-321-1234567', role: 'donor', status: 'active', location: 'Lahore', cnic: '35201-1234567-1', joinedDate: '2025-10-15', totalDonations: 150000, lastActive: '2025-12-18' },
  { id: 2, name: 'Fatima Bibi', email: 'fatima.bibi@example.com', phone: '+92-333-2345678', role: 'victim', status: 'active', location: 'Sukkur', cnic: '45301-2345678-2', joinedDate: '2025-11-20', familySize: 6, aidReceived: 3, lastActive: '2025-12-17' },
  { id: 3, name: 'Ahmed Raza Malik', email: 'ahmed.malik@example.com', phone: '+92-300-3456789', role: 'volunteer', status: 'active', location: 'Karachi', cnic: '42201-3456789-3', joinedDate: '2025-09-05', hoursServed: 156, lastActive: '2025-12-18' },
  { id: 4, name: 'Ayesha Siddiqui', email: 'ayesha.s@example.com', phone: '+92-312-4567890', role: 'donor', status: 'active', location: 'Islamabad', cnic: '17301-4567890-4', joinedDate: '2025-08-10', totalDonations: 250000, lastActive: '2025-12-16' },
  { id: 5, name: 'Imran Hussain', email: 'imran.h@example.com', phone: '+92-345-5678901', role: 'victim', status: 'pending', location: 'Jacobabad', cnic: '44201-5678901-5', joinedDate: '2025-12-01', familySize: 8, aidReceived: 1, lastActive: '2025-12-18' },
  { id: 6, name: 'Zainab Noor', email: 'zainab.noor@example.com', phone: '+92-301-6789012', role: 'admin', status: 'active', location: 'Lahore', cnic: '35202-6789012-6', joinedDate: '2025-07-01', lastActive: '2025-12-18' },
  { id: 7, name: 'Hassan Abbas', email: 'hassan.a@example.com', phone: '+92-322-7890123', role: 'volunteer', status: 'active', location: 'Multan', cnic: '36101-7890123-7', joinedDate: '2025-10-20', hoursServed: 89, lastActive: '2025-12-17' },
  { id: 8, name: 'Samina Khatoon', email: 'samina.k@example.com', phone: '+92-311-8901234', role: 'victim', status: 'active', location: 'Dadu', cnic: '44501-8901234-8', joinedDate: '2025-11-15', familySize: 5, aidReceived: 2, lastActive: '2025-12-18' },
  { id: 9, name: 'Bilal Ahmed', email: 'bilal.ahmed@example.com', phone: '+92-334-9012345', role: 'donor', status: 'active', location: 'Faisalabad', cnic: '33101-9012345-9', joinedDate: '2025-09-25', totalDonations: 75000, lastActive: '2025-12-15' },
  { id: 10, name: 'Nasreen Begum', email: 'nasreen.b@example.com', phone: '+92-302-0123456', role: 'victim', status: 'active', location: 'Larkana', cnic: '44301-0123456-0', joinedDate: '2025-12-10', familySize: 7, aidReceived: 0, lastActive: '2025-12-18' }
];

// Aid Requests with detailed information
const mockAidRequests = [
  { id: 'AR-2025-001', userName: 'Fatima Bibi', userId: 2, location: 'Sukkur, Sindh', type: 'Food', priority: 'critical', status: 'pending', date: '2025-12-18', description: 'Family of 6 has not received food supplies for 3 days', familySize: 6, coordinates: { lat: 27.7136, lng: 68.8402 }, contactPhone: '+92-333-2345678' },
  { id: 'AR-2025-002', userName: 'Imran Hussain', userId: 5, location: 'Jacobabad, Sindh', type: 'Medical', priority: 'critical', status: 'in-progress', date: '2025-12-17', description: 'Elderly family member needs insulin and blood pressure medication', familySize: 8, coordinates: { lat: 28.2769, lng: 68.4514 }, contactPhone: '+92-345-5678901', assignedVolunteer: 'Ahmed Raza Malik' },
  { id: 'AR-2025-003', userName: 'Samina Khatoon', userId: 8, location: 'Dadu, Sindh', type: 'Shelter', priority: 'high', status: 'approved', date: '2025-12-16', description: 'House completely destroyed, family staying in temporary tent', familySize: 5, coordinates: { lat: 26.7319, lng: 67.7760 }, contactPhone: '+92-311-8901234' },
  { id: 'AR-2025-004', userName: 'Nasreen Begum', userId: 10, location: 'Larkana, Sindh', type: 'Water', priority: 'high', status: 'pending', date: '2025-12-18', description: 'Clean drinking water needed urgently, children falling sick', familySize: 7, coordinates: { lat: 27.5570, lng: 68.2028 }, contactPhone: '+92-302-0123456' },
  { id: 'AR-2025-005', userName: 'Abdul Rehman', userId: 11, location: 'Shikarpur, Sindh', type: 'Food', priority: 'medium', status: 'completed', date: '2025-12-15', description: 'Monthly ration needed for family', familySize: 4, coordinates: { lat: 27.9556, lng: 68.6383 }, contactPhone: '+92-315-1234567', completedDate: '2025-12-16' },
  { id: 'AR-2025-006', userName: 'Rukhsana Parveen', userId: 12, location: 'Khairpur, Sindh', type: 'Clothing', priority: 'medium', status: 'approved', date: '2025-12-14', description: 'Winter clothing needed for 3 children', familySize: 5, coordinates: { lat: 27.5295, lng: 68.7592 }, contactPhone: '+92-316-2345678' },
  { id: 'AR-2025-007', userName: 'Ghulam Mustafa', userId: 13, location: 'Mehar, Sindh', type: 'Medical', priority: 'critical', status: 'in-progress', date: '2025-12-18', description: 'Pregnant woman needs immediate medical attention', familySize: 6, coordinates: { lat: 27.1839, lng: 67.8275 }, contactPhone: '+92-317-3456789', assignedVolunteer: 'Dr. Sarah Khan' },
  { id: 'AR-2025-008', userName: 'Khadija Bibi', userId: 14, location: 'Nawabshah, Sindh', type: 'Shelter', priority: 'low', status: 'pending', date: '2025-12-13', description: 'Temporary shelter repair materials needed', familySize: 3, coordinates: { lat: 26.2483, lng: 68.4098 }, contactPhone: '+92-318-4567890' }
];

// Shelters with comprehensive details
const mockShelters = [
  { id: 1, name: 'Camp Sukkur Central', location: 'Sukkur, Sindh', address: 'Near Lansdowne Bridge, Sukkur', capacity: 800, occupied: 720, status: 'active', availableAid: ['Food', 'Water', 'Medical', 'Clothing'], coordinator: 'Asad Malik', coordinatorPhone: '+92-321-1111111', facilities: ['Medical Center', 'Water Filtration', 'Kitchen', 'Children Area'], lastUpdated: '2025-12-18', coordinates: { lat: 27.7051, lng: 68.8573 } },
  { id: 2, name: 'Jacobabad Relief Center', location: 'Jacobabad, Sindh', address: 'Government School Building, Main Road', capacity: 500, occupied: 485, status: 'active', availableAid: ['Food', 'Water', 'Medical'], coordinator: 'Sana Fatima', coordinatorPhone: '+92-322-2222222', facilities: ['Medical Center', 'Kitchen'], lastUpdated: '2025-12-18', coordinates: { lat: 28.2815, lng: 68.4376 } },
  { id: 3, name: 'Larkana Community Shelter', location: 'Larkana, Sindh', address: 'Community Hall, Station Road', capacity: 600, occupied: 380, status: 'active', availableAid: ['Food', 'Water', 'Clothing', 'Hygiene Kits'], coordinator: 'Tariq Jameel', coordinatorPhone: '+92-323-3333333', facilities: ['Kitchen', 'Water Filtration', 'Sanitation'], lastUpdated: '2025-12-17', coordinates: { lat: 27.5570, lng: 68.2028 } },
  { id: 4, name: 'Dadu Emergency Camp', location: 'Dadu, Sindh', address: 'Sports Ground, Civil Lines', capacity: 450, occupied: 420, status: 'critical', availableAid: ['Food', 'Water'], coordinator: 'Nadia Hassan', coordinatorPhone: '+92-324-4444444', facilities: ['Kitchen', 'Basic Medical'], lastUpdated: '2025-12-18', coordinates: { lat: 26.7319, lng: 67.7760 } },
  { id: 5, name: 'Khairpur Shelter Complex', location: 'Khairpur, Sindh', address: 'Near Faiz Mahal, Old City', capacity: 350, occupied: 180, status: 'active', availableAid: ['Food', 'Water', 'Medical', 'Clothing', 'Education'], coordinator: 'Kamran Ali', coordinatorPhone: '+92-325-5555555', facilities: ['Medical Center', 'Kitchen', 'Children School', 'Women Section'], lastUpdated: '2025-12-16', coordinates: { lat: 27.5295, lng: 68.7592 } },
  { id: 6, name: 'Shikarpur Relief Base', location: 'Shikarpur, Sindh', address: 'Government College Campus', capacity: 400, occupied: 310, status: 'active', availableAid: ['Food', 'Water', 'Medical'], coordinator: 'Rabia Nawaz', coordinatorPhone: '+92-326-6666666', facilities: ['Medical Center', 'Kitchen', 'Water Storage'], lastUpdated: '2025-12-17', coordinates: { lat: 27.9556, lng: 68.6383 } },
  { id: 7, name: 'Mehar Transit Camp', location: 'Mehar, Sindh', address: 'Town Hall Area', capacity: 250, occupied: 230, status: 'active', availableAid: ['Food', 'Water'], coordinator: 'Faisal Bhatti', coordinatorPhone: '+92-327-7777777', facilities: ['Kitchen', 'Basic Sanitation'], lastUpdated: '2025-12-18', coordinates: { lat: 27.1839, lng: 67.8275 } },
  { id: 8, name: 'Nawabshah Central Relief', location: 'Nawabshah, Sindh', address: 'Sports Complex, Main Boulevard', capacity: 550, occupied: 290, status: 'active', availableAid: ['Food', 'Water', 'Medical', 'Clothing', 'Hygiene Kits'], coordinator: 'Amna Siddiqui', coordinatorPhone: '+92-328-8888888', facilities: ['Full Medical Facility', 'Kitchen', 'Children Area', 'Counseling Center'], lastUpdated: '2025-12-16', coordinates: { lat: 26.2483, lng: 68.4098 } }
];

// Comprehensive Inventory
const mockInventory = [
  { id: 1, name: 'Rice (25kg bags)', category: 'food', quantity: 2500, unit: 'bags', minStock: 500, status: 'adequate', location: 'Central Warehouse Sukkur', lastRestocked: '2025-12-15', expiryDate: '2026-06-15' },
  { id: 2, name: 'Flour (10kg bags)', category: 'food', quantity: 3200, unit: 'bags', minStock: 800, status: 'adequate', location: 'Central Warehouse Sukkur', lastRestocked: '2025-12-14', expiryDate: '2026-03-14' },
  { id: 3, name: 'Cooking Oil (5L)', category: 'food', quantity: 1800, unit: 'bottles', minStock: 400, status: 'adequate', location: 'Central Warehouse Sukkur', lastRestocked: '2025-12-12', expiryDate: '2026-12-12' },
  { id: 4, name: 'Bottled Water (1.5L)', category: 'water', quantity: 15000, unit: 'bottles', minStock: 5000, status: 'adequate', location: 'Multiple Locations', lastRestocked: '2025-12-18' },
  { id: 5, name: 'Water Purification Tablets', category: 'water', quantity: 850, unit: 'packs', minStock: 1000, status: 'low', location: 'Medical Storage', lastRestocked: '2025-12-10', expiryDate: '2027-12-10' },
  { id: 6, name: 'First Aid Kits', category: 'medical', quantity: 180, unit: 'kits', minStock: 200, status: 'low', location: 'Medical Storage', lastRestocked: '2025-12-08' },
  { id: 7, name: 'Paracetamol (500mg)', category: 'medical', quantity: 5000, unit: 'strips', minStock: 2000, status: 'adequate', location: 'Medical Storage', lastRestocked: '2025-12-16', expiryDate: '2027-06-16' },
  { id: 8, name: 'ORS Packets', category: 'medical', quantity: 3500, unit: 'packets', minStock: 1500, status: 'adequate', location: 'Medical Storage', lastRestocked: '2025-12-15', expiryDate: '2027-12-15' },
  { id: 9, name: 'Insulin Vials', category: 'medical', quantity: 45, unit: 'vials', minStock: 100, status: 'critical', location: 'Cold Storage Medical', lastRestocked: '2025-12-05', expiryDate: '2026-02-05' },
  { id: 10, name: 'Blood Pressure Medicine', category: 'medical', quantity: 320, unit: 'strips', minStock: 200, status: 'adequate', location: 'Medical Storage', lastRestocked: '2025-12-12', expiryDate: '2027-12-12' },
  { id: 11, name: 'Tents (Family Size)', category: 'shelter', quantity: 85, unit: 'pieces', minStock: 150, status: 'low', location: 'Equipment Warehouse', lastRestocked: '2025-12-01' },
  { id: 12, name: 'Blankets (Heavy)', category: 'shelter', quantity: 2200, unit: 'pieces', minStock: 1000, status: 'adequate', location: 'Equipment Warehouse', lastRestocked: '2025-12-10' },
  { id: 13, name: 'Sleeping Mats', category: 'shelter', quantity: 1500, unit: 'pieces', minStock: 500, status: 'adequate', location: 'Equipment Warehouse', lastRestocked: '2025-12-08' },
  { id: 14, name: 'Plastic Sheets (Tarpaulin)', category: 'shelter', quantity: 420, unit: 'pieces', minStock: 300, status: 'adequate', location: 'Equipment Warehouse', lastRestocked: '2025-12-12' },
  { id: 15, name: 'Men Clothes Set', category: 'clothing', quantity: 890, unit: 'sets', minStock: 500, status: 'adequate', location: 'Clothing Storage', lastRestocked: '2025-12-14' },
  { id: 16, name: 'Women Clothes Set', category: 'clothing', quantity: 1200, unit: 'sets', minStock: 600, status: 'adequate', location: 'Clothing Storage', lastRestocked: '2025-12-14' },
  { id: 17, name: 'Children Clothes (Mixed)', category: 'clothing', quantity: 320, unit: 'sets', minStock: 400, status: 'low', location: 'Clothing Storage', lastRestocked: '2025-12-10' },
  { id: 18, name: 'Hygiene Kits', category: 'hygiene', quantity: 650, unit: 'kits', minStock: 400, status: 'adequate', location: 'General Storage', lastRestocked: '2025-12-13' },
  { id: 19, name: 'Sanitary Pads', category: 'hygiene', quantity: 2800, unit: 'packs', minStock: 1000, status: 'adequate', location: 'General Storage', lastRestocked: '2025-12-15' },
  { id: 20, name: 'Baby Diapers', category: 'hygiene', quantity: 180, unit: 'packs', minStock: 300, status: 'low', location: 'General Storage', lastRestocked: '2025-12-08' }
];

// Donations tracking
const mockDonations = [
  { id: 'DON-2025-001', donorName: 'Muhammad Ali Khan', donorId: 1, type: 'monetary', amount: 150000, currency: 'PKR', status: 'completed', date: '2025-12-18', paymentMethod: 'Bank Transfer', reference: 'TRX123456', purpose: 'General Relief Fund' },
  { id: 'DON-2025-002', donorName: 'Ayesha Siddiqui', donorId: 4, type: 'monetary', amount: 250000, currency: 'PKR', status: 'completed', date: '2025-12-17', paymentMethod: 'Online Payment', reference: 'PAY789012', purpose: 'Medical Supplies' },
  { id: 'DON-2025-003', donorName: 'Habib Bank Foundation', donorId: null, type: 'monetary', amount: 1000000, currency: 'PKR', status: 'completed', date: '2025-12-16', paymentMethod: 'Corporate Transfer', reference: 'CORP345678', purpose: 'Shelter Construction' },
  { id: 'DON-2025-004', donorName: 'Bilal Ahmed', donorId: 9, type: 'monetary', amount: 75000, currency: 'PKR', status: 'completed', date: '2025-12-15', paymentMethod: 'JazzCash', reference: 'JZ901234', purpose: 'Food Supplies' },
  { id: 'DON-2025-005', donorName: 'Pakistan Red Crescent', donorId: null, type: 'in-kind', items: [{ name: 'Medical Kits', quantity: 500 }, { name: 'Blankets', quantity: 1000 }], status: 'received', date: '2025-12-14', purpose: 'Emergency Relief' },
  { id: 'DON-2025-006', donorName: 'Engro Foundation', donorId: null, type: 'monetary', amount: 2500000, currency: 'PKR', status: 'completed', date: '2025-12-13', paymentMethod: 'Corporate Transfer', reference: 'ENGRO567890', purpose: 'Rehabilitation Program' },
  { id: 'DON-2025-007', donorName: 'Anonymous Donor', donorId: null, type: 'monetary', amount: 50000, currency: 'PKR', status: 'pending', date: '2025-12-18', paymentMethod: 'Easypaisa', reference: 'EP123789', purpose: 'General Relief Fund' },
  { id: 'DON-2025-008', donorName: 'USAID Pakistan', donorId: null, type: 'in-kind', items: [{ name: 'Water Purifiers', quantity: 200 }, { name: 'Tents', quantity: 300 }, { name: 'Food Packs', quantity: 5000 }], status: 'in-transit', date: '2025-12-12', purpose: 'Emergency Response', estimatedArrival: '2025-12-20' }
];

// Volunteers with detailed info
const mockVolunteers = [
  { id: 1, name: 'Ahmed Raza Malik', email: 'ahmed.malik@example.com', phone: '+92-300-3456789', role: 'Field Coordinator', skills: ['First Aid', 'Logistics', 'Team Management'], status: 'active', location: 'Sukkur', joinedDate: '2025-09-05', hoursServed: 156, assignedShelter: 'Camp Sukkur Central', availability: 'Full-time', emergencyContact: '+92-300-9876543' },
  { id: 2, name: 'Hassan Abbas', email: 'hassan.a@example.com', phone: '+92-322-7890123', role: 'Medical Assistant', skills: ['Basic Medical Care', 'Patient Handling'], status: 'active', location: 'Multan', joinedDate: '2025-10-20', hoursServed: 89, assignedShelter: 'Jacobabad Relief Center', availability: 'Part-time', emergencyContact: '+92-322-1234567' },
  { id: 3, name: 'Dr. Sarah Khan', email: 'sarah.khan@example.com', phone: '+92-331-1234567', role: 'Medical Doctor', skills: ['Emergency Medicine', 'Pediatrics', 'General Practice'], status: 'active', location: 'Karachi', joinedDate: '2025-08-15', hoursServed: 234, assignedShelter: 'Multiple', availability: 'On-call', emergencyContact: '+92-331-7654321' },
  { id: 4, name: 'Usman Ghani', email: 'usman.g@example.com', phone: '+92-315-2345678', role: 'Logistics Coordinator', skills: ['Supply Chain', 'Vehicle Management', 'Inventory'], status: 'active', location: 'Hyderabad', joinedDate: '2025-09-20', hoursServed: 178, assignedShelter: 'Central Warehouse', availability: 'Full-time', emergencyContact: '+92-315-8765432' },
  { id: 5, name: 'Maryam Noor', email: 'maryam.n@example.com', phone: '+92-316-3456789', role: 'Community Liaison', skills: ['Communication', 'Local Language', 'Counseling'], status: 'active', location: 'Larkana', joinedDate: '2025-10-01', hoursServed: 145, assignedShelter: 'Larkana Community Shelter', availability: 'Full-time', emergencyContact: '+92-316-9876543' },
  { id: 6, name: 'Fahad Hussain', email: 'fahad.h@example.com', phone: '+92-317-4567890', role: 'IT Support', skills: ['Technical Support', 'Data Entry', 'Communication Systems'], status: 'active', location: 'Islamabad', joinedDate: '2025-11-01', hoursServed: 67, assignedShelter: 'Remote', availability: 'Part-time', emergencyContact: '+92-317-0987654' },
  { id: 7, name: 'Sadia Perveen', email: 'sadia.p@example.com', phone: '+92-318-5678901', role: 'Child Care Specialist', skills: ['Child Psychology', 'Education', 'Recreation'], status: 'active', location: 'Nawabshah', joinedDate: '2025-10-15', hoursServed: 112, assignedShelter: 'Nawabshah Central Relief', availability: 'Full-time', emergencyContact: '+92-318-1098765' },
  { id: 8, name: 'Rashid Mehmood', email: 'rashid.m@example.com', phone: '+92-319-6789012', role: 'Security Coordinator', skills: ['Security', 'Crowd Management', 'Emergency Response'], status: 'active', location: 'Dadu', joinedDate: '2025-09-10', hoursServed: 198, assignedShelter: 'Dadu Emergency Camp', availability: 'Full-time', emergencyContact: '+92-319-2109876' }
];

// Emergency Alerts
const mockAlerts = [
  { id: 'ALT-001', type: 'critical', title: 'Insulin Stock Critical', message: 'Insulin stock at Medical Storage is critically low (45 vials remaining). Immediate restocking required.', category: 'inventory', status: 'active', createdAt: '2025-12-18T08:30:00Z', priority: 1 },
  { id: 'ALT-002', type: 'warning', title: 'Dadu Camp Near Capacity', message: 'Dadu Emergency Camp is at 93% capacity. Consider expanding or redirecting new arrivals.', category: 'shelter', status: 'active', createdAt: '2025-12-18T07:15:00Z', priority: 2 },
  { id: 'ALT-003', type: 'critical', title: 'Medical Emergency - Mehar', message: 'Pregnant woman in critical condition at Mehar Transit Camp requires immediate evacuation.', category: 'medical', status: 'in-progress', createdAt: '2025-12-18T09:45:00Z', priority: 1, assignedTo: 'Dr. Sarah Khan' },
  { id: 'ALT-004', type: 'warning', title: 'Water Purification Tablets Low', message: 'Water purification tablets stock is below minimum threshold. Current: 850, Required: 1000', category: 'inventory', status: 'active', createdAt: '2025-12-17T14:20:00Z', priority: 3 },
  { id: 'ALT-005', type: 'info', title: 'USAID Shipment Arriving', message: 'Large shipment from USAID expected on Dec 20. Prepare warehouse space for 5000+ items.', category: 'logistics', status: 'acknowledged', createdAt: '2025-12-17T10:00:00Z', priority: 4 },
  { id: 'ALT-006', type: 'warning', title: 'Children Clothing Stock Low', message: 'Children clothing sets running low. Current stock may last only 3-4 days.', category: 'inventory', status: 'active', createdAt: '2025-12-16T16:30:00Z', priority: 3 },
  { id: 'ALT-007', type: 'critical', title: 'Multiple Critical Aid Requests', message: '23 critical priority aid requests pending. Immediate action required.', category: 'aid-requests', status: 'active', createdAt: '2025-12-18T06:00:00Z', priority: 1 },
  { id: 'ALT-008', type: 'info', title: 'Weekly Report Due', message: 'Weekly situation report for NDMA due tomorrow. Please compile all data.', category: 'administrative', status: 'active', createdAt: '2025-12-17T09:00:00Z', priority: 5 }
];

// Distribution Records
const mockDistributions = [
  { id: 'DIST-001', date: '2025-12-18', shelter: 'Camp Sukkur Central', items: [{ name: 'Food Packs', quantity: 150 }, { name: 'Water (1.5L)', quantity: 500 }], familiesServed: 150, coordinator: 'Asad Malik', status: 'completed' },
  { id: 'DIST-002', date: '2025-12-18', shelter: 'Jacobabad Relief Center', items: [{ name: 'Medical Kits', quantity: 25 }, { name: 'ORS Packets', quantity: 200 }], familiesServed: 100, coordinator: 'Dr. Sarah Khan', status: 'completed' },
  { id: 'DIST-003', date: '2025-12-17', shelter: 'Dadu Emergency Camp', items: [{ name: 'Food Packs', quantity: 120 }, { name: 'Blankets', quantity: 80 }], familiesServed: 120, coordinator: 'Rashid Mehmood', status: 'completed' },
  { id: 'DIST-004', date: '2025-12-17', shelter: 'Larkana Community Shelter', items: [{ name: 'Hygiene Kits', quantity: 100 }, { name: 'Children Clothes', quantity: 50 }], familiesServed: 100, coordinator: 'Maryam Noor', status: 'completed' },
  { id: 'DIST-005', date: '2025-12-18', shelter: 'Mehar Transit Camp', items: [{ name: 'Food Packs', quantity: 80 }, { name: 'Water Bottles', quantity: 300 }], familiesServed: 80, coordinator: 'Faisal Bhatti', status: 'in-progress' }
];

// Audit Logs
const mockAuditLogs = [
  { id: 1, action: 'LOGIN', user: 'admin@floodaid.com', details: 'Admin logged in from 192.168.1.100', timestamp: '2025-12-18T09:00:00Z', ipAddress: '192.168.1.100' },
  { id: 2, action: 'UPDATE_AID_STATUS', user: 'admin@floodaid.com', details: 'Changed status of AR-2025-002 from pending to in-progress', timestamp: '2025-12-18T09:15:00Z', entityType: 'AidRequest', entityId: 'AR-2025-002' },
  { id: 3, action: 'CREATE_USER', user: 'admin@floodaid.com', details: 'Created new user: Nasreen Begum (victim)', timestamp: '2025-12-18T08:30:00Z', entityType: 'User', entityId: 10 },
  { id: 4, action: 'UPDATE_INVENTORY', user: 'admin@floodaid.com', details: 'Updated stock: Rice Bags quantity changed to 2500', timestamp: '2025-12-17T16:45:00Z', entityType: 'Inventory', entityId: 1 },
  { id: 5, action: 'APPROVE_DONATION', user: 'admin@floodaid.com', details: 'Approved donation DON-2025-007 (PKR 50,000)', timestamp: '2025-12-17T14:20:00Z', entityType: 'Donation', entityId: 'DON-2025-007' },
  { id: 6, action: 'ASSIGN_VOLUNTEER', user: 'admin@floodaid.com', details: 'Assigned Dr. Sarah Khan to AR-2025-007', timestamp: '2025-12-18T09:50:00Z', entityType: 'AidRequest', entityId: 'AR-2025-007' },
  { id: 7, action: 'UPDATE_SHELTER', user: 'admin@floodaid.com', details: 'Updated Dadu Emergency Camp capacity info', timestamp: '2025-12-17T11:30:00Z', entityType: 'Shelter', entityId: 4 },
  { id: 8, action: 'GENERATE_REPORT', user: 'admin@floodaid.com', details: 'Generated weekly situation report', timestamp: '2025-12-16T17:00:00Z', entityType: 'Report', entityId: 'RPT-2025-012' },
  { id: 9, action: 'DISTRIBUTION_COMPLETE', user: 'admin@floodaid.com', details: 'Marked distribution DIST-001 as completed (150 families)', timestamp: '2025-12-18T12:00:00Z', entityType: 'Distribution', entityId: 'DIST-001' },
  { id: 10, action: 'ALERT_ACKNOWLEDGED', user: 'admin@floodaid.com', details: 'Acknowledged alert ALT-005 (USAID Shipment)', timestamp: '2025-12-17T10:30:00Z', entityType: 'Alert', entityId: 'ALT-005' }
];

// Analytics Data
const mockAnalytics = {
  aidRequestsTrend: [
    { date: '2025-12-12', pending: 45, inProgress: 12, completed: 78 },
    { date: '2025-12-13', pending: 52, inProgress: 15, completed: 85 },
    { date: '2025-12-14', pending: 61, inProgress: 18, completed: 92 },
    { date: '2025-12-15', pending: 73, inProgress: 22, completed: 101 },
    { date: '2025-12-16', pending: 82, inProgress: 25, completed: 115 },
    { date: '2025-12-17', pending: 85, inProgress: 28, completed: 128 },
    { date: '2025-12-18', pending: 89, inProgress: 31, completed: 136 }
  ],
  donationsTrend: [
    { date: '2025-12-12', amount: 320000 },
    { date: '2025-12-13', amount: 2580000 },
    { date: '2025-12-14', amount: 150000 },
    { date: '2025-12-15', amount: 95000 },
    { date: '2025-12-16', amount: 1050000 },
    { date: '2025-12-17', amount: 275000 },
    { date: '2025-12-18', amount: 200000 }
  ],
  shelterOccupancy: [
    { name: 'Sukkur Central', occupancy: 90 },
    { name: 'Jacobabad', occupancy: 97 },
    { name: 'Larkana', occupancy: 63 },
    { name: 'Dadu', occupancy: 93 },
    { name: 'Khairpur', occupancy: 51 },
    { name: 'Shikarpur', occupancy: 78 },
    { name: 'Mehar', occupancy: 92 },
    { name: 'Nawabshah', occupancy: 53 }
  ],
  aidByType: [
    { type: 'Food', count: 2340, percentage: 35 },
    { type: 'Water', count: 1560, percentage: 23 },
    { type: 'Medical', count: 1020, percentage: 15 },
    { type: 'Shelter', count: 890, percentage: 13 },
    { type: 'Clothing', count: 620, percentage: 9 },
    { type: 'Other', count: 320, percentage: 5 }
  ],
  regionStats: [
    { region: 'Sukkur Division', affectedFamilies: 2450, aidDistributed: 1890, shelterCapacity: 1300 },
    { region: 'Larkana Division', affectedFamilies: 1890, aidDistributed: 1450, shelterCapacity: 1000 },
    { region: 'Hyderabad Division', affectedFamilies: 2100, aidDistributed: 1620, shelterCapacity: 1100 },
    { region: 'Mirpurkhas Division', affectedFamilies: 1280, aidDistributed: 980, shelterCapacity: 750 },
    { region: 'Shaheed Benazirabad', affectedFamilies: 1200, aidDistributed: 920, shelterCapacity: 700 }
  ]
};

// Simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// ADMIN API OBJECT
// ============================================================================
export const adminApi = {
  // ============================================================================
  // DASHBOARD APIs
  // ============================================================================
  
  getDashboardStats: async () => {
    await delay();
    return mockStats;
  },

  getRecentActivities: async () => {
    await delay();
    return mockAuditLogs.slice(0, 5).map(log => ({
      id: log.id,
      type: log.action.toLowerCase().includes('user') ? 'user' : 
            log.action.toLowerCase().includes('aid') ? 'request' :
            log.action.toLowerCase().includes('shelter') ? 'shelter' : 'inventory',
      message: log.details,
      timestamp: log.timestamp
    }));
  },

  getAlerts: async () => {
    await delay();
    return mockAlerts;
  },

  acknowledgeAlert: async (alertId) => {
    await delay();
    const alert = mockAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      return { success: true, message: 'Alert acknowledged' };
    }
    throw new Error('Alert not found');
  },

  resolveAlert: async (alertId) => {
    await delay();
    const alert = mockAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      return { success: true, message: 'Alert resolved' };
    }
    throw new Error('Alert not found');
  },

  // ============================================================================
  // USERS APIs
  // ============================================================================
  
  getUsers: async (filters = {}) => {
    await delay();
    let filtered = [...mockUsers];
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter(u => u.role === filters.role);
    }
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(u => u.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search) ||
        u.location?.toLowerCase().includes(search)
      );
    }
    return filtered;
  },

  getUserById: async (userId) => {
    await delay();
    return mockUsers.find(u => u.id === userId);
  },

  createUser: async (userData) => {
    await delay();
    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0]
    };
    mockUsers.push(newUser);
    return newUser;
  },

  updateUser: async (userId, userData) => {
    await delay();
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...userData };
      return mockUsers[index];
    }
    throw new Error('User not found');
  },

  deleteUser: async (userId) => {
    await delay();
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      mockUsers.splice(index, 1);
      return { success: true, message: 'User deleted successfully' };
    }
    throw new Error('User not found');
  },

  // ============================================================================
  // AID REQUESTS APIs
  // ============================================================================
  
  getAidRequests: async (filters = {}) => {
    await delay();
    let filtered = [...mockAidRequests];
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(r => r.type === filters.type);
    }
    return filtered;
  },

  getAidRequestById: async (requestId) => {
    await delay();
    return mockAidRequests.find(r => r.id === requestId);
  },

  updateAidRequestStatus: async (requestId, status, assignedVolunteer = null) => {
    await delay();
    const index = mockAidRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      mockAidRequests[index].status = status;
      if (assignedVolunteer) {
        mockAidRequests[index].assignedVolunteer = assignedVolunteer;
      }
      if (status === 'completed') {
        mockAidRequests[index].completedDate = new Date().toISOString().split('T')[0];
      }
      return mockAidRequests[index];
    }
    throw new Error('Aid request not found');
  },

  deleteAidRequest: async (requestId) => {
    await delay();
    const index = mockAidRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      mockAidRequests.splice(index, 1);
      return { success: true, message: 'Aid request deleted successfully' };
    }
    throw new Error('Aid request not found');
  },

  // ============================================================================
  // SHELTERS APIs
  // ============================================================================
  
  getShelters: async () => {
    await delay();
    return mockShelters;
  },

  getShelterById: async (shelterId) => {
    await delay();
    return mockShelters.find(s => s.id === shelterId);
  },

  createShelter: async (shelterData) => {
    await delay();
    const newShelter = {
      id: mockShelters.length + 1,
      ...shelterData,
      occupied: shelterData.occupied || 0,
      status: shelterData.status || 'active',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    mockShelters.push(newShelter);
    return newShelter;
  },

  updateShelter: async (shelterId, shelterData) => {
    await delay();
    const index = mockShelters.findIndex(s => s.id === shelterId);
    if (index !== -1) {
      mockShelters[index] = { 
        ...mockShelters[index], 
        ...shelterData,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      return mockShelters[index];
    }
    throw new Error('Shelter not found');
  },

  deleteShelter: async (shelterId) => {
    await delay();
    const index = mockShelters.findIndex(s => s.id === shelterId);
    if (index !== -1) {
      mockShelters.splice(index, 1);
      return { success: true, message: 'Shelter deleted successfully' };
    }
    throw new Error('Shelter not found');
  },

  // ============================================================================
  // INVENTORY APIs
  // ============================================================================
  
  getInventory: async (filters = {}) => {
    await delay();
    let filtered = [...mockInventory];
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(i => i.category === filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(i => i.status === filters.status);
    }
    return filtered;
  },

  getInventoryItemById: async (itemId) => {
    await delay();
    return mockInventory.find(i => i.id === itemId);
  },

  createInventoryItem: async (itemData) => {
    await delay();
    const newItem = {
      id: mockInventory.length + 1,
      ...itemData,
      status: itemData.quantity > itemData.minStock ? 'adequate' : 
              itemData.quantity > 0 ? 'low' : 'critical',
      lastRestocked: new Date().toISOString().split('T')[0]
    };
    mockInventory.push(newItem);
    return newItem;
  },

  updateInventoryItem: async (itemId, itemData) => {
    await delay();
    const index = mockInventory.findIndex(i => i.id === itemId);
    if (index !== -1) {
      mockInventory[index] = { ...mockInventory[index], ...itemData };
      mockInventory[index].status = mockInventory[index].quantity > mockInventory[index].minStock ? 'adequate' : 
                                     mockInventory[index].quantity > 0 ? 'low' : 'critical';
      return mockInventory[index];
    }
    throw new Error('Inventory item not found');
  },

  deleteInventoryItem: async (itemId) => {
    await delay();
    const index = mockInventory.findIndex(i => i.id === itemId);
    if (index !== -1) {
      mockInventory.splice(index, 1);
      return { success: true, message: 'Inventory item deleted successfully' };
    }
    throw new Error('Inventory item not found');
  },

  updateInventoryStock: async (itemId, quantity) => {
    await delay();
    const index = mockInventory.findIndex(i => i.id === itemId);
    if (index !== -1) {
      mockInventory[index].quantity = quantity;
      mockInventory[index].status = quantity > mockInventory[index].minStock ? 'adequate' : 
                                     quantity > 0 ? 'low' : 'critical';
      mockInventory[index].lastRestocked = new Date().toISOString().split('T')[0];
      return mockInventory[index];
    }
    throw new Error('Inventory item not found');
  },

  // ============================================================================
  // DONATIONS APIs
  // ============================================================================
  
  getDonations: async (filters = {}) => {
    await delay();
    let filtered = [...mockDonations];
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(d => d.type === filters.type);
    }
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(d => d.status === filters.status);
    }
    return filtered;
  },

  getDonationById: async (donationId) => {
    await delay();
    return mockDonations.find(d => d.id === donationId);
  },

  createDonation: async (donationData) => {
    await delay();
    const newDonation = {
      id: `DON-2025-${String(mockDonations.length + 1).padStart(3, '0')}`,
      ...donationData,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    mockDonations.push(newDonation);
    return newDonation;
  },

  updateDonationStatus: async (donationId, status) => {
    await delay();
    const index = mockDonations.findIndex(d => d.id === donationId);
    if (index !== -1) {
      mockDonations[index].status = status;
      return mockDonations[index];
    }
    throw new Error('Donation not found');
  },

  // ============================================================================
  // VOLUNTEERS APIs
  // ============================================================================
  
  getVolunteers: async (filters = {}) => {
    await delay();
    let filtered = [...mockVolunteers];
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(v => v.status === filters.status);
    }
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter(v => v.role === filters.role);
    }
    return filtered;
  },

  getVolunteerById: async (volunteerId) => {
    await delay();
    return mockVolunteers.find(v => v.id === volunteerId);
  },

  createVolunteer: async (volunteerData) => {
    await delay();
    const newVolunteer = {
      id: mockVolunteers.length + 1,
      ...volunteerData,
      joinedDate: new Date().toISOString().split('T')[0],
      hoursServed: 0,
      status: 'active'
    };
    mockVolunteers.push(newVolunteer);
    return newVolunteer;
  },

  updateVolunteer: async (volunteerId, volunteerData) => {
    await delay();
    const index = mockVolunteers.findIndex(v => v.id === volunteerId);
    if (index !== -1) {
      mockVolunteers[index] = { ...mockVolunteers[index], ...volunteerData };
      return mockVolunteers[index];
    }
    throw new Error('Volunteer not found');
  },

  deleteVolunteer: async (volunteerId) => {
    await delay();
    const index = mockVolunteers.findIndex(v => v.id === volunteerId);
    if (index !== -1) {
      mockVolunteers.splice(index, 1);
      return { success: true, message: 'Volunteer removed successfully' };
    }
    throw new Error('Volunteer not found');
  },

  // ============================================================================
  // DISTRIBUTIONS APIs
  // ============================================================================
  
  getDistributions: async () => {
    await delay();
    return mockDistributions;
  },

  createDistribution: async (distributionData) => {
    await delay();
    const newDistribution = {
      id: `DIST-${String(mockDistributions.length + 1).padStart(3, '0')}`,
      ...distributionData,
      date: new Date().toISOString().split('T')[0],
      status: 'in-progress'
    };
    mockDistributions.push(newDistribution);
    return newDistribution;
  },

  updateDistributionStatus: async (distributionId, status) => {
    await delay();
    const index = mockDistributions.findIndex(d => d.id === distributionId);
    if (index !== -1) {
      mockDistributions[index].status = status;
      return mockDistributions[index];
    }
    throw new Error('Distribution not found');
  },

  // ============================================================================
  // ANALYTICS APIs
  // ============================================================================
  
  getAnalytics: async () => {
    await delay();
    return mockAnalytics;
  },

  // ============================================================================
  // AUDIT LOGS APIs
  // ============================================================================
  
  getAuditLogs: async (filters = {}) => {
    await delay();
    let filtered = [...mockAuditLogs];
    if (filters.action) {
      filtered = filtered.filter(l => l.action === filters.action);
    }
    if (filters.startDate) {
      filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
    }
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // ============================================================================
  // REPORTS APIs
  // ============================================================================
  
  generateReport: async (reportType, startDate, endDate) => {
    await delay();
    return {
      reportType,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      data: {
        summary: {
          totalRecords: Math.floor(Math.random() * 500) + 100,
          period: `${startDate} to ${endDate}`
        },
        charts: mockAnalytics
      },
      message: `${reportType} report generated successfully`
    };
  },

  exportReport: async (reportType, format) => {
    await delay();
    return {
      success: true,
      message: `Report exported as ${format.toUpperCase()}`,
      downloadUrl: `#/downloads/report-${reportType}-${Date.now()}.${format}`
    };
  },

  // ============================================================================
  // SETTINGS APIs
  // ============================================================================
  
  getSettings: async () => {
    await delay();
    return {
      siteName: 'FloodAid Pakistan',
      organization: 'National Disaster Management Authority',
      adminEmail: 'admin@floodaid.pk',
      emergencyHotline: '1166',
      notificationsEnabled: true,
      emailNotifications: true,
      smsNotifications: true,
      alertThresholds: {
        inventoryLow: 80,
        inventoryCritical: 50,
        shelterCapacity: 90
      },
      autoAssignVolunteers: true,
      requireApprovalForAid: true
    };
  },

  updateSettings: async (settingsData) => {
    await delay();
    return {
      success: true,
      message: 'Settings updated successfully',
      settings: settingsData
    };
  },

  // Real API call for dashboard metrics
  getDashboardMetrics: async (token) => {
    const API_BASE = process.env.REACT_APP_API_BASE || 'https://floodaid-api.onrender.com';
    const response = await fetch(`${API_BASE}/api/metrics/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch metrics');
    }

    return await response.json();
  },

  // Real API call for assignment status metrics
  getAssignmentStatusMetrics: async (token) => {
    const API_BASE = process.env.REACT_APP_API_BASE || 'https://floodaid-api.onrender.com';
    const response = await fetch(`${API_BASE}/api/metrics/assignment-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch metrics');
    }

    return await response.json();
  }
};

export default adminApi;
