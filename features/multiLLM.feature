Feature: Multi-LLM Responses
    Scenario: User submits a prompt and receives two Responses
        Given I am logged in
        And I am on the dashboard page
        When I enter "What is AI?" into the chat input
        And I send the message
        Then I should see multiple LLM responses