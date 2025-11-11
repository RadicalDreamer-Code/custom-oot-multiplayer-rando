import re
import argparse
import os


def convert_file_to_timestamps(input_file):
    """
    Converts a file with log entries to a formatted timestamps file.

    Parameters:
    input_file (str): Path to the input file containing the log entries.
    """
    # Generate the output filename by changing the extension to .txt
    output_file = os.path.splitext(input_file)[0] + ".txt"

    # Regular expression to match log entries
    log_pattern = re.compile(
        r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (\d+) was found by (\d+)"
    )

    output_lines = []

    # Read the input file
    with open(input_file, "r", encoding="utf-8") as file:
        lines = file.readlines()

    # Process each line to extract relevant information
    for line in lines:
        match = log_pattern.match(line.strip())
        if match:
            timestamp = match.group(1)
            found_value = match.group(2)
            found_by = match.group(3)

            # Format the output lines
            output_lines.append(f"HOTKEY: @ {timestamp}")
            output_lines.append(f"Found by {found_by}: {found_value}")
            output_lines.append("")  # Add an empty line for spacing

    # Write the output to a file
    with open(output_file, "w", encoding="utf-8") as output:
        output.write("\n".join(output_lines))

    print(f"Converted {input_file} to {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert log entries to formatted timestamp records."
    )
    parser.add_argument(
        "input_file", help="Path to the input file containing log entries."
    )

    args = parser.parse_args()

    # Call the conversion function
    convert_file_to_timestamps(args.input_file)


if __name__ == "__main__":
    main()
