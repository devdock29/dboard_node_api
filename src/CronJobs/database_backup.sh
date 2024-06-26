#!/bin/bash

#Database details
DATABASE_NAME="thundertechsol_dboard_qa"
DATABASE_USERNAME="thundertechsol_mab"
DATABASE_PASSWORD="MABuser123$"
DATABASE_HOST="23.106.120.176"
DATABASE_PORT="3306"

# Backup file details (customizable)
#PROD Directory URL

BACKUP_DIRECTORY="Database_Info/Backups"
# BACKUP_DIRECTORY="/Users/devdock/Desktop/MyDesktop/NodeJS/dboard_node_api/Database_Info/Backups"

BACKUP_FILENAME="backup_$(date -u +'%Y-%m-%d_%H').sql"

# Error handling and logging
# exec &>> >(tee -a database_backup.log)  # Redirect standard output and error to log file

# Validate database credentials
mysqladmin ping -h "$DATABASE_HOST" -P "$DATABASE_PORT" -u "$DATABASE_USERNAME" -p"$DATABASE_PASSWORD" 2>&1 >/dev/null
if [[ $? -ne 0 ]]; then
  echo "Error: Could not connect to MySQL using provided credentials."
  exit 1
fi

# Check if backup directory exists
if [ ! -d "$BACKUP_DIRECTORY" ]; then
  mkdir -p "$BACKUP_DIRECTORY"
fi

# Perform backup
mysqldump -h "$DATABASE_HOST" -P "$DATABASE_PORT" -u "$DATABASE_USERNAME" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" >"$BACKUP_DIRECTORY/$BACKUP_FILENAME"

if [[ $? -ne 0 ]]; then
  echo "Error: Backup failed. See log for details."
else
  echo "Backup completed successfully to: $BACKUP_DIRECTORY/$BACKUP_FILENAME"
fi
