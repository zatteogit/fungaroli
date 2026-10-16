"""Interfaccia riproducibile: python -m tools.fronda_model --help."""

import argparse
import json
from pathlib import Path


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def read_jsonl(path):
    rows = []
    for number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if line.strip():
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ValueError(f"JSON non valido alla riga {number}") from error
    return rows


def write_json(path, value):
    text = json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    if path:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Path(path).write_text(text, encoding="utf-8")
    else:
        print(text, end="")


def main():
    parser = argparse.ArgumentParser(description="Fronda v3 · ricerca offline")
    commands = parser.add_subparsers(dest="command", required=True)
    feature_parser = commands.add_parser("features", help="Costruisce variabili causali dal meteo")
    feature_parser.add_argument("--weather", required=True, help="JSON con rows e metadata")
    feature_parser.add_argument("--date", required=True, help="Giorno bersaglio YYYY-MM-DD")
    feature_parser.add_argument("--context", help="JSON con quota, chioma, ospiti e pH")
    feature_parser.add_argument("--issued-at", help="Cutoff ISO con fuso; non inventa la disponibilità passata")
    feature_parser.add_argument("--out")
    train_parser = commands.add_parser("train", help="Addestra e calibra una sola specie e protocollo")
    train_parser.add_argument("--input", required=True, help="Uscite JSONL con split espliciti")
    train_parser.add_argument("--feature-list", required=True, help="JSON: elenco nomi variabili")
    train_parser.add_argument("--taxon", required=True)
    train_parser.add_argument("--out-dir", required=True)
    predict_parser = commands.add_parser("predict", help="Stima interna di ricerca, mai percentuale pubblica")
    predict_parser.add_argument("--artifact", required=True)
    predict_parser.add_argument("--input", required=True, help="Una uscita JSON")
    predict_parser.add_argument("--out")
    args = parser.parse_args()
    try:
        if args.command == "features":
            from .features import build_features
            weather = read_json(args.weather)
            context = read_json(args.context) if args.context else {}
            output = build_features(weather["rows"], args.date, context, issued_at=args.issued_at)
            output["source_metadata"] = weather.get("metadata", {})
            write_json(args.out, output)
        elif args.command == "train":
            from .learning import fit_encounter
            artifact, report = fit_encounter(read_jsonl(args.input), read_json(args.feature_list), args.taxon)
            destination = Path(args.out_dir)
            write_json(destination / "artifact.json", artifact)
            write_json(destination / "validation.json", report)
        elif args.command == "predict":
            from .learning import predict_encounter
            write_json(args.out, predict_encounter(read_json(args.artifact), read_json(args.input)))
    except (ValueError, KeyError, OSError, TypeError) as error:
        parser.exit(2, f"Input rifiutato: {error}\n")


if __name__ == "__main__":
    main()
