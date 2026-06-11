@revert(["Create all models"])
down
    pass

up
    # Create tables
    op.create_table('users', Column("..."))  # Full SQLAlchemy migration boilerplate
    ...
    # All model creations go here
    # Example:
    op.create_table('trains', Column(...))  # Replace with complete migration
    ...