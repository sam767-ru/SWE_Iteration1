Feature: User Navigation
  Scenario: User clicks Sign In from Landing Page
    Given I open the landing page
    When I click the "Sign In" button
    Then I should be on the login page