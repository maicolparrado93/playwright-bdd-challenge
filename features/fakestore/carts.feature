@fakestore
Feature: Shopping Cart Management
  As a customer
  I want to manage my shopping cart through the API
  So that I can add, modify, and review items before checkout

  Background:
    Given the API is available

  # ─── Smoke Tests ─────────────────────────────────────────────────────────────

  @smoke
  Scenario: Get all carts returns a non-empty list
    When I request all carts
    Then the response status should be 200
    And the response should contain a list of carts
    And each cart should have id, userId and products

  @smoke
  Scenario: Get a single cart by valid ID
    When I request cart with id 1
    Then the response status should be 200
    And the cart should have id 1
    And the cart should contain products

  # ─── Regression Tests ────────────────────────────────────────────────────────

  @regression
  Scenario: Create a new cart with multiple products
    When I create a cart with the following data:
      | productId | quantity |
      | 1         | 2        |
      | 3         | 1        |
    Then the response status should be 200 or 201
    And the response should contain the new cart with an id

  @regression
  Scenario: Update an existing cart
    When I update cart 1 with product 2 quantity 3
    Then the response status should be 200
    And the response should contain the updated cart

  @regression
  Scenario: Delete a cart
    When I delete cart 3
    Then the response status should be 200
    And the deleted cart id should be returned
