# Request Module Refinement - Integration Guide

## Task 1: Request Details Modal - IMPLEMENTATION STEPS

### Step 1: Update Requests.jsx imports (Line 1-3)
Change from:
```jsx
import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-react';
import '../../styles/AdminTables.css';
```

To:
```jsx
import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertTriangle, CheckCircle, XCircle, Filter, Eye } from 'lucide-react';
import '../../styles/AdminTables.css';
import RequestDetailModal from './RequestDetailModal';
```

### Step 2: Add state for modal (Line 11-12)
Add after `const [showFilterDropdown, setShowFilterDropdown] = useState(false);`:
```jsx
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
```

### Step 3: Add createFullRequest helper function
Add before the return statement (around line 200), inside the component but before JSX:
```jsx
    const createFullRequest = (req) => {
        return {
            ...req,
            createdAtFull: new Date(req.createdAt).toLocaleString()
        };
    };
```

### Step 4: Add modal handlers
Add these functions before the return statement:
```jsx
    const handleOpenModal = (request) => {
        setSelectedRequest(createFullRequest(request));
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRequest(null);
    };
```

### Step 5: Update table row to be clickable
Find the table row `<tr key={r.id}>` and make it clickable:
```jsx
<tr 
    key={r.id} 
    onClick={() => handleOpenModal(r)}
    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
>
```

### Step 6: Add View button to Actions column
In the Actions cell (TD), add:
```jsx
<button
    className="icon-btn"
    title="View Details"
    onClick={(e) => {
        e.stopPropagation();
        handleOpenModal(r);
    }}
    style={{ color: '#3b82f6' }}
>
    <Eye size={18} />
</button>
```

### Step 7: Render modal before closing component tag
Add before the final `</div>` in the return statement:
```jsx
        {showModal && selectedRequest && (
            <RequestDetailModal 
                request={selectedRequest}
                onClose={handleCloseModal}
                onStatusUpdate={handleStatusUpdate}
            />
        )}
```

---

## After implementing these steps:
1. The admin can click any request row to open a detailed modal
2. Modal shows all request info: contact details, description, map, status
3. Status can be changed directly from the modal
4. Modal closes after status update or when clicking Close button

## Files Modified:
- `frontend/src/Pages/Admin/Requests.jsx` - Add modal state, handlers, and UI integration
- `frontend/src/Pages/Admin/RequestDetailModal.jsx` - NEW FILE (already created)

## Testing:
1. Go to Admin Requests page
2. Click on any request row
3. Modal opens showing all details
4. Click map to verify location
5. Change status from dropdown in modal
6. Verify status updates both in modal and table
7. Close modal and see table updated
