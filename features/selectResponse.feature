Feature: Select Best Response
    Scenario: User selects one response from multiple LLM outputs
        Given I am logged in and on the dashboard page
        And multiple LLM responses are displayed
        When I click the "Select" button on one response
        Then that response should be marked as selected
