@fakestore
Feature: Authentication
  As a registered user
  I want to authenticate with the platform
  So that I can access protected resources

  Background:
    Given the API is available

  # ─── Smoke Tests ─────────────────────────────────────────────────────────────

  @smoke
  Scenario: Successful login with valid credentials
    When I login with username "mor_2314" and password "83r5^_"
    Then the response status should be 200 or 201
    And the response should contain a JWT token

  # ─── Regression Tests ────────────────────────────────────────────────────────

  @regression
  Scenario: Login with wrong password is rejected
    When I login with username "mor_2314" and password "wrongpassword123"
    Then the response should indicate authentication failure

  @regression
  Scenario: Login with non-existent username is rejected
    When I login with username "nonexistent_user_xyz" and password "anypassword"
    Then the response should indicate authentication failure

  @regression
  Scenario: Login with empty username is rejected
    When I login with an empty username
    Then the response should indicate authentication failure

  @regression
  Scenario: Login with empty password is rejected
    When I login with an empty password
    Then the response should indicate authentication failure
