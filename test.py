import itertools
data = {
    "signal": ["x", "y"],
    "signal2": ["a", "b"],
    "signal3": ["1", "2"]
}

# Get the lists of values from each signal
value_lists = list(data.values())
print(value_lists)
combinations = itertools.product(*value_lists)

# Join each tuple into a string
results = ["".join(combo) for combo in combinations]

print(results)