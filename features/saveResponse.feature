Feature: Save Selected Response
    Scenario: User saves a selected response
        Given I am logged in and on the dashboard page
        And I have selected a response
        When I click the "Save Selected Response" button
        Then the selected response should be saved sucessfully
