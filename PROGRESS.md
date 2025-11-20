## Shallwe Frontend – Next UI Refactor Steps (Figma alignment)

Context: We aligned palette/typography to Figma (DeepBlue/Blue2/Coral, Rubik, 10px radii) and restored full field coverage in setup/settings. Next, we need to formalize field layers so setup and settings/edit stay in sync without duplicated definitions.

### Layering plan (for another LLM/engineer to continue)

**Layer 2: App field-type kit (built on shadcn primitives)**
- TextField (single-line), NumberField
- TextareaField (optional counter/hint)
- SelectField (single)
- SelectRangeField (paired min/max selects)
- NumberRangeField (paired min/max numbers)
- RadioGroupField
- CheckboxField (single boolean)
- CheckboxGroupField (multi-boolean set)
- TagField (chips with validation)
- DateField (wraps BirthDateSelect logic)
- LocationField (search + chips)
- PhotoField (upload + crop + validation)
- StatusChip (generic label + tone)
- Stepper (progress helper; layout-only)

**Layer 3: Concrete domain fields using the kit**
- Profile: displayName (TextField), photo (PhotoField), birthDate (DateField)
- About: gender (Radio), isCouple, hasChildren (Checkbox); occupationType, drinkingLevel, smokingLevel, neighbourlinessLevel, guestsLevel, partiesLevel, bedtimeLevel, neatnessLevel (Select); smokingTypes (CheckboxGroup); animalsOwned (CheckboxGroup); otherAnimalsTags (TagField); interestsTags (TagField); bio (Textarea with counter).
- Preferences: budget (NumberRangeField: min/max), rentDuration (SelectRangeField: min/max), roomSharingLevel (Select), locations (LocationField).
- Account/Meta: visibilityStatus (StatusChip + Button toggle).

### How to apply
- Extract Layer 2 components (e.g., `src/components/fields/*`).
- Create a shared field config map (layer 3) with ids, labels, options, validators, and render type.
- Refactor `src/app/setup/page.tsx` to render steps from the shared config + stepper shell.
- Refactor `src/app/settings/page.tsx` and `ProfileEditView` to render the same config in card layout.
- Keep page-specific wrappers (stepper vs. cards), but no duplicated field definitions/options.

Status: palette/typography/radii updated; setup/settings fields restored; lint clean. Branch `ui-refactor` ahead by 2 commits. Next action is implementing the layering above.
