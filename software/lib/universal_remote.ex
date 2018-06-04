defmodule UniversalRemote do
  use Application

  # See http://elixir-lang.org/docs/stable/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec

    # Define workers and child supervisors to be supervised
    {:ok, remotes} = Application.fetch_env(:universal_remote, :remotes)
    {:ok, devices} = Application.fetch_env(:universal_remote, :devices)
    {:ok, devices_paths} = Application.fetch_env(:universal_remote, :devices_paths)
    {:ok, autoload_devices} = Application.fetch_env(:universal_remote, :autoload_devices)

    children = [
      worker(Remotes, [remotes]),
      worker(Devices, []),
      worker(Devices.Loader, [devices_paths]),
      supervisor(Devices.State, []),
      supervisor(Supervisors.Buses, []),
      supervisor(Supervisors.Servers, []),
      supervisor(Handlers, [devices])
    ]

    children = case autoload_devices do
      true -> [ worker(Devices.Filewatcher, [devices_paths]) | children ]
      false -> children
    end

    # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: UniversalRemote.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
