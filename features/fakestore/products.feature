@fakestore
Feature: Product Catalog Management
  As an e-commerce platform operator
  I want to manage the product catalog through the API
  So that users can browse, and admins can maintain inventory

  Background:
    Given the API is available

  # ─── Smoke Tests ─────────────────────────────────────────────────────────────

  @smoke
  Scenario: Get all products returns a non-empty catalog
    When I request all products
    Then the response status should be 200
    And the response should contain a list of products
    And each product should have the required fields

  @smoke
  Scenario: Get a single product by valid ID
    When I request product with id 1
    Then the response status should be 200
    And the product should have id 1
    And the product should have a valid title and positive price

  @smoke
  Scenario: Get all product categories
    When I request all product categories
    Then the response status should be 200
    And the response should contain a list of categories

  # ─── Regression Tests ────────────────────────────────────────────────────────

  @regression
  Scenario: Paginate product catalog with a limit parameter
    When I request all products with limit 5
    Then the response status should be 200
    And the product list should contain exactly 5 products

  @regression
  Scenario: Filter products by an existing category
    When I request products in category "electronics"
    Then the response status should be 200
    And the response should contain a list of products
    And all products should belong to category "electronics"

  @regression
  Scenario: Create a new product with valid data
    When I create a product with the following data:
      | title       | Wireless Noise-Cancelling Headphones |
      | price       | 149.99                               |
      | description | Premium sound quality with ANC       |
      | image       | https://i.pravatar.cc/150            |
      | category    | electronics                          |
    Then the response status should be 200 or 201
    And the response should contain the new product with an id

  @regression
  Scenario: Update an existing product with full replacement
    When I update product 1 with the following data:
      | title    | Updated Smart TV 4K  |
      | price    | 999.99               |
      | category | electronics          |
    Then the response status should be 200
    And the product title should be "Updated Smart TV 4K"
    And the product price should be 999.99

  @regression
  Scenario: Partially update a product price
    When I partially update product 2 with the following data:
      | price | 49.99 |
    Then the response status should be 200
    And the product price should be 49.99

  @regression
  Scenario: Delete a product
    When I delete product 5
    Then the response status should be 200
    And the deleted product id should be returned

  # FakeStoreAPI BUG: returns 200 with null body instead of 404 for non-existent resources.
  # This test documents the actual (incorrect) API behavior.
  # A proper REST implementation should return 404. Filed as known API limitation.
  @regression
  Scenario: Request a product that does not exist returns empty body
    When I request product with id 9999
    Then the response status should be 200
    And the response body should be null
