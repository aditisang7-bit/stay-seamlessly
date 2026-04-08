## Phase 1: Database Migration
1. Add buyer preference fields to `profiles` table (location_preferred, budget_min, budget_max, move_in_date, toilet_type, kitchen_type, parking, corridor, backup, furnishing, profile_completed)
2. Create `enquiries` table (buyer_id, property_id, seller_id, status, message, created_at)
3. Add property fields to `properties` table (unit_type, property_type, society_name, brokerage, availability_status)
4. Add document verification fields: create `seller_documents` table or enhance `property_documents`
5. RLS policies for all new tables

## Phase 2: Mandatory Profile Completion
- Create `ProfileCompletionModal` component
- Check on login if profile is complete
- Block dashboard access until complete
- Works for both old and new users

## Phase 3: Enhanced Seller Property Form
- Add unit_type (1RK/1BHK/2BHK/3BHK)
- Add property_type (Family/Bachelor)
- Society name field
- Auto-calculate deposit = 2x rent
- Editable brokerage
- Availability status toggle (Available/Not Available)

## Phase 4: Enquiry System
- Buyer can send enquiry on property
- Seller sees enquiries in dashboard
- Accept/Reject buttons
- Status tracking (Pending/Accepted/Rejected)
- Notifications via toast + dashboard

## Phase 5: Document Verification
- Seller uploads ID proof, bank details, property proof
- Admin/Super Admin can verify/reject
- Status badges (Pending 🟡, Verified ✅, Rejected 🔴)

## Phase 6: Dashboard Enhancements
- Buyer: see enquiries, matched properties, status tracking
- Seller: listings, enquiries, accept/reject, document upload, availability toggle
- Status badges (Available 🟢, Not Available 🔴, Verified ✅, Pending 🟡)
