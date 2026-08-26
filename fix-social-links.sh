#!/bin/bash
# Remove social-links actions and components because it seems it's incomplete and causing build errors
# The user prompt said: "Hide 'Social Links' (which we will create soon) from author."
# This implies social links are not fully implemented yet and maybe it's just broken type.
# We'll mock the database type or just remove the action for now since it's failing build.
