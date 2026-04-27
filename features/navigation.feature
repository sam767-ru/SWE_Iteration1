Feature: Iteration 3 LLM Model Selection

  Scenario: User can navigate from landing page to sign in
    Given I open the landing page
    When I click the "Sign In" button
    Then I should be on the login page

  Scenario: User can see all backend LLM options
    Given I am signed in and on the dashboard
    Then I should see the model options "Local Model", "GPT", "Gemini", and "Claude"

  Scenario: User can select GPT and send a math question
    Given I am signed in and on the dashboard
    When I select the "gpt" model
    And I send the message "Help me with this math equation"
    Then I should see a bot response containing "[GPT]"

  Scenario: User can select Gemini and ask about weather
    Given I am signed in and on the dashboard
    When I select the "gemini" model
    And I send the message "What is the weather today?"
    Then I should see a bot response containing "[Gemini]"

  Scenario: User can select Claude and send a question
    Given I am signed in and on the dashboard
    When I select the "claude" model
    And I send the message "Explain recursion"
    Then I should see a bot response containing "[Claude]"