Feature: Multi-LLM Responses
    Scenario: User submits a prompt and receives two Responses
        Given I am logged in and on the dashboard page
        When I enter "What is AI?" into the prompt box
        And I click the "Send" button
        Then I should see two LLM responses displayed
