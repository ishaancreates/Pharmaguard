import urllib.request
import gzip
import json
import os

url = "http://hgdownload.cse.ucsc.edu/goldenPath/hg38/database/cytoBand.txt.gz"
output_path = "../client/src/assets/cytoBand_hg38.json"

# Ensure directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

print(f"Downloading from {url}...")
try:
    with urllib.request.urlopen(url) as response:
        with gzip.GzipFile(fileobj=response) as f:
            lines = f.read().decode('utf-8').splitlines()

    print(f"Downloaded {len(lines)} lines.")

    cytobands = {}

    for line in lines:
        parts = line.split('\t')
        if len(parts) < 5:
            continue
            
        chrom = parts[0]
        start = int(parts[1])
        end = int(parts[2])
        name = parts[3]
        gieStain = parts[4]

        # Filter for main chromosomes only (1-22, X, Y)
        if "_" in chrom:
            continue
        
        # Add to structure
        if chrom not in cytobands:
            cytobands[chrom] = []
        
        cytobands[chrom].append({
            "name": name,
            "start": start,
            "end": end,
            "gieStain": gieStain
        })

    # Sort keys to ensure order chr1..chr22..chrX..chrY
    sorted_chroms = ["chr" + str(i) for i in range(1, 23)] + ["chrX", "chrY"]
    ordered_cytobands = {k: cytobands[k] for k in sorted_chroms if k in cytobands}

    with open(output_path, 'w') as f:
        json.dump(ordered_cytobands, f, separators=(',', ':'))

    print(f"Successfully created {output_path}")
    print("Example snippet (first 2 bands of chr1):")
    print(json.dumps(ordered_cytobands['chr1'][:2], indent=2))

except Exception as e:
    print(f"Error: {e}")
