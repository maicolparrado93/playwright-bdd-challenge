@fakestore
Feature: User Profile Management (FakeStore)
  As a platform administrator
  I want to manage user profiles through the API
  So that I can register, view, update, and remove users

  Background:
    Given the API is available

  # ─── Smoke Tests ─────────────────────────────────────────────────────────────

  @smoke
  Scenario: Get all users returns a non-empty list
    When I request all fakestore users
    Then the response status should be 200
    And the response should contain a list of users
    And each user should have id, email and username

  @smoke
  Scenario: Get a single user by valid ID
    When I request fakestore user with id 1
    Then the response status should be 200
    And the user should have id 1
    And the user should have a valid email and username

  # ─── Regression Tests ────────────────────────────────────────────────────────

  @regression
  Scenario: Create a new user with valid data
    When I create a fakestore user with the following data:
      | email     | john.doe@example.com |
      | username  | johndoe2024          |
      | password  | s3cr3tP@ss           |
      | firstname | John                 |
      | lastname  | Doe                  |
      | phone     | 555-123-4567         |
    Then the response status should be 200 or 201
    And the response should contain the new user with an id

  @regression
  Scenario: Update a user email
    When I update fakestore user 1 with the following data:
      | email | updated.email@example.com |
    Then the response status should be 200
    And the user email should be "updated.email@example.com"

  @regression
  Scenario: Delete a user
    When I delete fakestore user 2
    Then the response status should be 200

  # FakeStoreAPI BUG: returns 200 with null body instead of 404 for non-existent resources.
  @regression
  Scenario: Request a user that does not exist returns empty body
    When I request fakestore user with id 9999
    Then the response status should be 200
    And the response body should be null
