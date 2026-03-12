# Family Management, Comments, and Weekly Menu Design
Status: **Approved**

This document outlines the architectural and flow details for three core features aimed at transforming this personal recipe application into a family-centric tool.

## 1. Family Management
**Goal:** Group users together so they can interact as a cohesive unit.

### Architecture & Data
We will introduce a new `Family` model. Since an individual user conceptually could be in multiple family groups (e.g., immediate family, extended family), but generally acts in one at a time, we'll establish a many-to-many relationship with `User`.

- `Family` Model:
  - `id` (String)
  - `name` (String)
  - `createdAt` (DateTime)
  
- `FamilyMember` Model:
  - `id` (String)
  - `familyId` (Relation to Family)
  - `userId` (Relation to User)
  - `role` (Enum: ADMIN, MEMBER)
  - `createdAt` (DateTime)

### UI Flow
- A new "Family Group" section accessible via the main navigation or settings.
- Any user can create a "Family" by providing a name. The creator is automatically assigned the `ADMIN` role.
- Since users are manually created by the administrator, the family creation process skips email invitations. Instead, the `ADMIN` is presented with a dropdown list of all users in the system and can select any user to instantly add them to the family. 
- The user conceptually just "appears" in the family group without any confirmation step.

---

## 2. Global Comments System
**Goal:** Allow users to share feedback, modifications, and thoughts on recipes globally across the application.

### Architecture & Data
Comments must be global. They will not be sandboxed to a single family. They will function like public reviews, visible to anyone who can see the recipe.

- `Comment` Model:
  - `id` (String)
  - `content` (String)
  - `recipeId` (Relation to Recipe)
  - `userId` (Relation to User)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

### UI Flow
- On the Recipe Detail page (`/recipes/[id]`), a new "Comments" section will be added below the content.
- Logged-in users can leave a comment. 
- Comments will be displayed chronologically, showing the content, the commenter's name, their avatar (if available), and the timestamp.

---

## 3. Weekly Menu & 30-Day Rolling History
**Goal:** Allow a family to collaboratively schedule meals and view a 30-day rolling history.

### Architecture & Data
To track meals scheduled for specific days, we will link Recipes to a specific Date and a specific Family.

- `MenuSchedule` Model:
  - `id` (String)
  - `date` (DateTime) - stored effectively as a date without a meaningful time component for scheduling purposes.
  - `familyId` (Relation to Family)
  - `recipeId` (Relation to Recipe)
  - `mealType` (Enum: BREAKFAST, LUNCH, DINNER, SNACK)
  - `userId` (Optional relation to the User who added it, for audit purposes)
  - `createdAt` (DateTime)

### Flow & UI
- A new "Weekly Menu" page will be added to the navigation.
- The UI will present a calendar grid or scrolling view, centered on the current day.
- Users can page forward to schedule up to 30 days in advance, or page backward to view up to 30 days of history.
- Clicking a day will open an interface (modal or dropdown) to search for and assign a recipe to that day, categorized by `mealType`.

### Database Cleanup Strategy: Lazy Deletion
To handle the automated cleanup of data older than 30 days without introducing external dependencies like cron jobs:
- Whenever the client makes a tRPC request to fetch the Menu data for a family, the backend resolver will execute two sequential database operations:
  1. **Deletion Query:** Delete all `MenuSchedule` records where `date` is older than `(Current Date - 30 days)`.
  2. **Fetch Query:** Fetch the requested range of schedules for the family.
- **Trade-off Note:** Data older than 30 days technically remains in the database until this specific endpoint is hit. Since this is a personal project, the simplicity of having the app clean itself up on-demand outweighs the overhead of setting up scheduled tasks.
