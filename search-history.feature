Feature: Search conversation history
    Scenario: Search finds relevant chat
        Given I am logged in 
        And I have a previous chat
        When I search for a keyword
        Then the relevant conversation should be displayed
