import re
import argparse
from datetime import datetime, timedelta
import os


def convert_file_to_vtt(input_file):
    """
    Converts a file with log entries to a VTT file, keeping the input filename and changing only the extension to .vtt.

    Parameters:
    input_file (str): Path to the input file containing log entries.
    """
    # Generate the output filename by changing the extension to .vtt
    output_file = os.path.splitext(input_file)[0] + ".vtt"

    # Regular expression to match log entries
    log_pattern = re.compile(
        r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (\d+) was found by (\d+)"
    )

    vtt_lines = ["WEBVTT\n"]  # Start with the WEBVTT header
    base_time = None  # To calculate relative times for the VTT

    # Read the input file
    with open(input_file, "r", encoding="utf-8") as file:
        lines = file.readlines()

    # Process each line to extract timestamp and text
    for i, line in enumerate(lines):
        match = log_pattern.match(line.strip())
        if match:
            timestamp = match.group(1)
            found_value = match.group(2)
            found_by = match.group(3)
            text = f"{found_value} was found by {found_by}"

            # Convert timestamp to datetime object
            current_time = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
            if base_time is None:
                base_time = current_time  # Set the base time to the first timestamp

            # Calculate relative time in seconds
            delta = current_time - base_time
            start_time_seconds = delta.total_seconds()

            # Format start and end times for VTT
            start_time = str(timedelta(seconds=start_time_seconds)) + ".000"
            end_time = (
                str(timedelta(seconds=start_time_seconds + 1)) + ".000"
            )  # Add 1 second duration

            # Ensure proper VTT formatting for start and end times
            start_time = start_time.replace(
                ".", ","
            )  # Replace "." with "," for VTT format
            end_time = end_time.replace(".", ",")

            # Add VTT entry
            vtt_lines.append(f"{start_time} --> {end_time}")
            vtt_lines.append(text)
            vtt_lines.append("")  # Blank line between entries

    # Write to the output file
    with open(output_file, "w", encoding="utf-8") as output:
        output.write("\n".join(vtt_lines))

    print(f"Converted {input_file} to {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert log entries to a WebVTT (.vtt) file."
    )
    parser.add_argument(
        "input_file", help="Path to the input file containing log entries."
    )

    args = parser.parse_args()

    # Call the conversion function
    convert_file_to_vtt(args.input_file)


if __name__ == "__main__":
    main()
