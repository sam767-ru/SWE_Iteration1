Feature: Save conversation history
    Scenario: Conversation remians after refresh
        Given I am logged in
        And I have an active conversation
        When I refresh the page
        Then my conversation should still be available
