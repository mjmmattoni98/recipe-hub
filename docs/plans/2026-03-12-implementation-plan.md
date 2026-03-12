# Implementation Plan: Family Management, Comments, and Weekly Menu

## Phase 1: Database and Schema Updates

1. **Update `prisma/schema.prisma`**
   - Import necessary enumerations for roles and meals (e.g., `enum FamilyRole { ADMIN MEMBER }`, `enum MealType { BREAKFAST LUNCH DINNER SNACK }`).
   - Add `Family` model (`id`, `name`, `createdAt`).
   - Add `FamilyMember` model (`id`, `familyId`, `userId`, `role`, `createdAt`).
   - Add `Comment` model (`id`, `content`, `recipeId`, `userId`, `createdAt`, `updatedAt`).
   - Add `MenuSchedule` model (`id`, `date`, `familyId`, `recipeId`, `mealType`, `userId`, `createdAt`).
   - Add relations to existing models (`User`, `Recipe`).

2. **Generate and Format Prisma Client**
   - Run `pnpm db:generate`.
   - Run `pnpm db:push` to apply changes to the local development database.

## Phase 2: Family Management Implementation

1. **Backend Integration (tRPC Routers)**
   - Create a new `family` tRPC router (`src/server/api/routers/family.ts`).
   - Implement queries:
     - `getMyFamilies`: Get families the current user is a member of.
     - `getAllUsers`: Get a list of all users in the system (for the admin to invite).
   - Implement mutations:
     - `createFamily`: Creates a new `Family` record and adds the creator as a `FamilyMember` with the `ADMIN` role.
     - `addMember`: Allows an `ADMIN` to add a specific `userId` to their family group as a `MEMBER`.

2. **Frontend UI Components**
   - Create a `FamilyManagement` page or section (`/app/family/page.tsx`).
   - Build a "Create Family" form component.
   - Build a "Family Members" list component that fetches members of a selected family.
   - Build an "Add Member" dropdown component that lists all users in the system and triggers the `addMember` mutation.

## Phase 3: Global Comments Implementation

1. **Backend Integration (tRPC Routers)**
   - Extend the existing `recipe` router or create a dedicated `comment` router (`src/server/api/routers/comment.ts`).
   - Implement queries:
     - `getCommentsByRecipeId`: Fetch comments for a recipe, including user data (name, avatar), sorted chronologically by `createdAt`.
   - Implement mutations:
     - `addComment`: Create a new comment linked to the recipe and the current user.

2. **Frontend UI Components**
   - Create a `CommentsSection` component (`src/components/recipes/CommentsSection.tsx`).
   - Integrate the comments list and a "Post Comment" form.
   - Embed this component underneath the main content on the Recipe Detail page (`/app/recipes/[id]/page.tsx`).

## Phase 4: Weekly Menu & History

1. **Backend Integration (tRPC Routers)**
   - Create a `menu` tRPC router (`src/server/api/routers/menu.ts`).
   - Implement queries:
     - `getWeeklyMenu`: Note - this requires implementing the Lazy Deletion strategy here.
       - **Step A:** Execute a Prisma `deleteMany` query to remove `MenuSchedule` records older than 30 days.
       - **Step B:** Execute a Prisma `findMany` query to get the `MenuSchedule` records for a given `familyId` within a requested date range (start date -> end date), including related `Recipe` details.
   - Implement mutations:
     - `scheduleRecipe`: Assigns a recipe to a specific date, family, and meal type.
     - `removeScheduledRecipe`: Deletes a specific `MenuSchedule` entry.

2. **Frontend UI Components**
   - Create a `WeeklyMenu` page (`/app/menu/page.tsx`).
   - Build a Date Range selector (able to span up to 30 days forward or backward).
   - Build a calendar or list grid that iterates over the selected dates.
   - For each day, provide a UI to drop in or search for recipes categorized by `mealType`.
   - Ensure the UI handles switching between different families if the user is a member of multiple.

## Phase 5: Testing and Polish

1. **Validation**
   - Ensure all inputs and form requests are strictly validated using Zod at the router level.
2. **Review & Polish**
   - Ensure components match the design aesthetic of the T3 Stack template using Tailwind CSS and the existing UI component library.
   - Verify that all newly created tRPC endpoints are properly protected by checking `ctx.session.user`.
