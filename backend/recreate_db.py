import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import database
import models

def recreate():
    print("Dropping all tables...")
    models.Base.metadata.drop_all(bind=database.engine)
    print("Creating all tables from current models...")
    models.Base.metadata.create_all(bind=database.engine)
    print("Database recreated successfully.")

if __name__ == "__main__":
    recreate()
