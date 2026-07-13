#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Flowternity Sports Platform MVP - Premium sports academy platform (Cult.fit-style).
  Member flow first: register -> pick membership -> mock payment -> dashboard -> book classes.
  Tech: Next.js 15 + MongoDB (adapted from FastAPI/Postgres in PRD).
  Auth: Email+Password JWT via httpOnly cookie. First user with email=ADMIN_EMAIL becomes admin.
  Payment: MOCKED (no real Razorpay yet).

backend:
  - task: "Auth (register/login/logout/me)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/auth/register creates user with role adult|parent (or admin if ADMIN_EMAIL matches), sets httpOnly cookie ft_token. POST /api/auth/login validates via scrypt. GET /api/auth/me returns current user. POST /api/auth/logout clears cookie."

  - task: "Config endpoint"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/config returns static SPORTS + MEMBERSHIPS arrays (from lib/flowternity/config.js)."

  - task: "Mock checkout & user_membership creation"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/checkout/mock with {membership_id, child_profile_id?, selected_sports?} creates user_memberships doc + payments doc (status=success, mock ref). Kids requires child_profile_id. Returns user_membership + payment."

  - task: "Child profile creation"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/children creates child (name, dob, gender, selected_sports up to 2). GET /api/children lists parent's children."

  - task: "Dashboard aggregation"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/dashboard returns active_membership, upcoming_classes, payments, announcements. Auto-expires memberships past expiry_date."

  - task: "Class listing + booking"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/classes?sport=&day= lists future classes with booked_count + is_booked. POST /api/bookings requires active membership; kids memberships restrict to selected sports. POST /api/bookings/:id/cancel cancels."

  - task: "Membership pause/resume"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/memberships/pause {days<=30} sets status=paused. POST /api/memberships/resume extends expiry_date by pause_days and sets status=active. Only ONE pause per membership (enforced)."

  - task: "Admin (classes CRUD + stats)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/admin/classes creates class (sport_id, coach_name, date, times, capacity). GET /api/admin/classes lists all. DELETE /api/admin/classes/:id removes. GET /api/admin/stats returns counters. Requires role=admin."

frontend:
  - task: "Landing page"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Screenshot verified. Cinematic hero + sports grid + memberships + CTA."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Auth (register/login/logout/me)"
    - "Mock checkout & user_membership creation"
    - "Class listing + booking"
    - "Dashboard aggregation"
    - "Admin (classes CRUD + stats)"
    - "Membership pause/resume"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Iteration 2 shipped:
      - Profile page (/profile) — role-aware: PARENT view shows kids + parent address, ADULT view shows address + emergency contact
      - Profile photo upload — base64 stored in Mongo (Cloudinary skipped for MVP)
      - Forgot/Reset password — in-app flow: /forgot generates token+link on screen (no email), /reset?token=... completes reset
      - Public pages: /about, /coaches (reads /api/coaches), /contact
      - Admin panel now full-featured with tabs: Classes, Members (search, view detail, edit, deactivate), Attendance (per class Present/Absent with bulk mark), Payments (with HTML invoice download), Coaches (CRUD), Announcements (CRUD, shown on member dashboard)
      - Nav updated with Coaches/About/Contact links + Profile in user dropdown
      - All routes compiling successfully (verified 200 on every page)
