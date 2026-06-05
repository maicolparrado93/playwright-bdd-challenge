@gorest
Feature: User Lifecycle E2E (GoRest)
  As a system administrator
  I need to manage the complete lifecycle of users
  So that registrations, updates, and deletions are reliable and data-consistent

  Background:
    Given the API is available
    And a unique test email is generated

  # ─── Smoke ───────────────────────────────────────────────────────────────────

  @smoke
  Scenario: Create a new user successfully
    When I create a GoRest user with name "Alice Smith" and gender "female"
    Then the response status should be 201
    And the user should be created successfully

  # ─── Regression — Full E2E lifecycle ────────────────────────────────────────

  @regression
  Scenario: Full user lifecycle — create, verify, update, and delete
    # Step 1: Register new user
    When I create a GoRest user with name "Bob Johnson" and gender "male"
    Then the response status should be 201
    And the user should be created successfully

    # Step 2: Verify data integrity — what we sent is what was persisted
    When I request the created user
    Then the response status should be 200
    And the created user data should match the submitted data

    # Step 3: Update email — contact info changes during user lifetime
    When I update the created user email to a new unique email
    Then the response status should be 200
    And the user email should match the updated email

    # Step 4: Verify update persisted
    When I request the created user
    Then the response status should be 200
    And the user email should match the updated email

    # Step 5: Attempt to create a duplicate — system must prevent it
    When I try to create another user with the same email
    Then the system should reject the duplicate with status 422
    And the error should indicate the email is already taken

    # Step 6: Delete the user
    When I delete the created user
    Then the response status should be 204

    # Step 7: Confirm the user no longer exists
    When I request the deleted user
    Then the user should no longer exist
